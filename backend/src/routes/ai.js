const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middlewares/auth');
const OpenAI = require('openai');

const router = express.Router();
const prisma = new PrismaClient();

// Generate AI summary for manager
router.post('/summary', authenticate, authorize('manager', 'admin'), async (req, res) => {
  try {
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

    // Map the workItems array into a simple string
    const itemsList = workItems.map(item => `- ${item.title} (${item.priority} priority)`).join('\n');

    // Initialize OpenAI properly
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Wrap the OpenAI call in a secondary try/catch specifically for the AI response
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a project management assistant. Provide a concise 2-sentence summary of the work items.',
          },
          {
            role: 'user',
            content: `Summarize these work items in 2 concise sentences:\n${itemsList}`,
          },
        ],
        max_tokens: 150,
      });

      // Return successful response with the AI's summary
      res.json({ summary: completion.choices[0].message.content });
    } catch (aiError) {
      // Check if the error is due to insufficient quota
      if (aiError.code === 'insufficient_quota' || aiError.status === 429) {
        // Log a warning to the terminal
        console.warn('OpenAI API quota exceeded. Using Preview Mode fallback.');
        console.warn('Error details:', {
          message: aiError.message,
          status: aiError.status,
          code: aiError.code,
        });
        
        // Return a successful response with a mock summary
        return res.json({ 
          summary: 'System Note: AI is in Preview Mode. You have ' + workItems.length + ' active items. The team is currently prioritized on: ' + (workItems[0]?.title || 'general tasks') + '.' 
        });
      }
      
      // Log other errors to the console
      console.error('OpenAI API call failed:', aiError);
      console.error('Error details:', {
        message: aiError.message,
        status: aiError.status,
        code: aiError.code,
        type: aiError.type,
      });
      
      // Return error for other types of failures
      res.status(500).json({ 
        error: 'Failed to generate AI summary', 
        message: aiError.message || 'OpenAI API call failed' 
      });
    }
  } catch (error) {
    console.error('AI summary route error:', error);
    res.status(500).json({ error: 'Failed to generate AI summary', message: error.message });
  }
});

// Generate AI summary from provided work items
router.post('/summarize', authenticate, authorize('manager', 'admin'), async (req, res) => {
  try {
    // Check if OpenAI is configured
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ 
        error: 'AI service not configured',
        message: 'OpenAI API key is not set. AI features are optional.' 
      });
    }

    const { workItems } = req.body;

    if (!workItems || !Array.isArray(workItems) || workItems.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid request',
        message: 'workItems array is required and must not be empty' 
      });
    }

    // Format work items for AI
    const itemsText = workItems.map((item) => {
      const assignedTo = item.assignedUser?.name || item.assignedTo || 'Unassigned';
      const project = item.project?.name || item.projectId || 'Unknown';
      return `- ${item.title} (${item.type}): ${item.status}, Priority: ${item.priority}, Assigned to: ${assignedTo}, Project: ${project}`;
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

    const prompt = `Summarize these work items in 2-3 professional sentences. Highlight any 'High' priority items or potential blockers.

Work Items:
${itemsText}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful project management assistant that provides clear, concise summaries.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 300,
    });

    const summaryContent = completion.choices[0].message.content;

    res.json({ summary: summaryContent });
  } catch (error) {
    // Check if the error is due to insufficient quota
    if (error.code === 'insufficient_quota' || error.status === 429) {
      // Log a warning to the terminal
      console.warn('OpenAI API quota exceeded. Using Preview Mode fallback.');
      console.warn('Error details:', {
        message: error.message,
        status: error.status,
        code: error.code,
      });
      
      // Return a successful response with a mock summary
      return res.json({ 
        summary: 'System Note: AI is in Preview Mode. You have ' + workItems.length + ' active items. The team is currently prioritized on: ' + (workItems[0]?.title || 'general tasks') + '.' 
      });
    }
    
    console.error('AI summarize error:', error);
    
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
