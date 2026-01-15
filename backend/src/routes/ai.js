const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Generate AI summary for manager
router.post('/summary', authenticate, authorize('manager', 'admin'), async (req, res) => {
  try {
    // Check if OpenAI is configured
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ 
        error: 'AI service not configured',
        message: 'OpenAI API key is not set. AI features are optional.' 
      });
    }

    // Get all open work items for summary
    const workItems = await prisma.workItem.findMany({
      where: {
        status: {
          not: 'done',
        },
      },
      include: {
        assignedUser: {
          select: {
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        priority: 'desc',
      },
    });

    // Format work items for AI
    const itemsText = workItems.map((item) => {
      return `- ${item.title} (${item.type}): ${item.status}, Priority: ${item.priority}, Assigned to: ${item.assignedUser?.name || 'Unassigned'}, Project: ${item.project.name}`;
    }).join('\n');

    // Call OpenAI API
    let OpenAI;
    try {
      OpenAI = require('openai');
    } catch (error) {
      return res.status(503).json({ 
        error: 'AI service not available',
        message: 'OpenAI package not installed. Install with: npm install openai' 
      });
    }
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `You are a project management assistant. Summarize the following work items for a manager. Focus on:
1. High-priority items that need attention
2. Blocked items
3. Items that are overdue or at risk
4. Overall team workload

Work Items:
${itemsText}

Provide a concise, actionable summary (2-3 paragraphs).`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful project management assistant that provides clear, actionable summaries.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 500,
    });

    const summaryContent = completion.choices[0].message.content;

    // Save summary to database
    const summary = await prisma.aISummary.create({
      data: {
        content: summaryContent,
        createdFor: req.user.id,
      },
    });

    res.json({ summary });
  } catch (error) {
    console.error('AI summary error:', error);
    
    // If OpenAI API fails, return a basic summary
    if (error.message?.includes('API key') || error.message?.includes('OpenAI')) {
      return res.status(503).json({ 
        error: 'AI service unavailable',
        message: 'AI service is currently unavailable. The app works without AI.' 
      });
    }

    res.status(500).json({ error: 'Failed to generate AI summary' });
  }
});

// Get AI summaries for current user
router.get('/summaries', authenticate, authorize('manager', 'admin'), async (req, res) => {
  try {
    const summaries = await prisma.aISummary.findMany({
      where: {
        createdFor: req.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10, // Last 10 summaries
    });

    res.json({ summaries });
  } catch (error) {
    console.error('Get summaries error:', error);
    res.status(500).json({ error: 'Failed to fetch summaries' });
  }
});

module.exports = router;
