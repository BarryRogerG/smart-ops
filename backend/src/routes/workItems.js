const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all work items (filtered by role)
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, priority, assignedTo, projectId } = req.query;
    
    const where = {};
    
    // Regular users only see their assigned items
    if (req.user.role === 'user') {
      where.assignedTo = req.user.id;
    }
    
    // Managers and admins see all items
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedTo) where.assignedTo = assignedTo;
    if (projectId) where.projectId = projectId;

    const workItems = await prisma.workItem.findMany({
      where,
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ workItems });
  } catch (error) {
    console.error('Get work items error:', error);
    res.status(500).json({ error: 'Failed to fetch work items' });
  }
});

// Get single work item
router.get('/:id', authenticate, async (req, res) => {
  try {
    const workItem = await prisma.workItem.findUnique({
      where: { id: req.params.id },
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!workItem) {
      return res.status(404).json({ error: 'Work item not found' });
    }

    // Regular users can only see their assigned items
    if (req.user.role === 'user' && workItem.assignedTo !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ workItem });
  } catch (error) {
    console.error('Get work item error:', error);
    res.status(500).json({ error: 'Failed to fetch work item' });
  }
});

// Create work item
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, description, type, priority, assignedTo, projectId } = req.body;

    if (!title || !projectId) {
      return res.status(400).json({ error: 'Title and projectId are required' });
    }

    const workItem = await prisma.workItem.create({
      data: {
        title,
        description,
        type: type || 'task',
        priority: priority || 'medium',
        assignedTo: assignedTo || null,
        createdBy: req.user.id,
        projectId,
      },
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json({ workItem });
  } catch (error) {
    console.error('Create work item error:', error);
    res.status(500).json({ error: 'Failed to create work item' });
  }
});

// Update work item
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { title, description, type, status, priority, assignedTo, projectId } = req.body;

    // Check if work item exists
    const existing = await prisma.workItem.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Work item not found' });
    }

    // Regular users can only update their assigned items, and only status
    if (req.user.role === 'user') {
      if (existing.assignedTo !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      // Users can only update status
      const workItem = await prisma.workItem.update({
        where: { id: req.params.id },
        data: {
          status: status || existing.status,
        },
        include: {
          assignedUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      return res.json({ workItem });
    }

    // Managers and admins can update everything
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (projectId !== undefined) updateData.projectId = projectId;

    const workItem = await prisma.workItem.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json({ workItem });
  } catch (error) {
    console.error('Update work item error:', error);
    res.status(500).json({ error: 'Failed to update work item' });
  }
});

// Delete work item (admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const workItem = await prisma.workItem.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Work item deleted', workItem });
  } catch (error) {
    console.error('Delete work item error:', error);
    res.status(500).json({ error: 'Failed to delete work item' });
  }
});

module.exports = router;
