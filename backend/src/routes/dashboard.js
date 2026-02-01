const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get dashboard data
router.get('/', authenticate, async (req, res) => {
  try {
    const where = {};
    
    // Regular users only see their assigned items
    if (req.user.role === 'user') {
      where.assignedTo = req.user.id;
    }

    // Get all open work items
    const openItems = await prisma.workItem.findMany({
      where: {
        ...where,
        status: {
          in: ['open', 'in_progress'],
        },
      },
      include: {
        assignedUser: {
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
        priority: 'desc',
      },
    });

    // Get high-priority issues
    const highPriorityItems = await prisma.workItem.findMany({
      where: {
        ...where,
        priority: {
          in: ['high', 'critical'],
        },
        status: {
          not: 'done',
        },
      },
      include: {
        assignedUser: {
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
        priority: 'desc',
      },
    });

    // Get on hold items
    const onHoldItems = await prisma.workItem.findMany({
      where: {
        ...where,
        status: 'on_hold',
      },
      include: {
        assignedUser: {
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

    // Get items per user (for managers/admins)
    let itemsPerUser = [];
    if (req.user.role === 'manager' || req.user.role === 'admin') {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      itemsPerUser = await Promise.all(
        users.map(async (user) => {
          const count = await prisma.workItem.count({
            where: {
              assignedTo: user.id,
              status: {
                not: 'done',
              },
            },
          });
          return {
            user,
            itemCount: count,
          };
        })
      );
    } else {
      // For regular users, just show their count
      const count = await prisma.workItem.count({
        where: {
          assignedTo: req.user.id,
          status: {
            not: 'done',
          },
        },
      });
      itemsPerUser = [
        {
          user: {
            id: req.user.id,
            name: req.user.name,
            email: req.user.email,
          },
          itemCount: count,
        },
      ];
    }

    res.json({
      openItems,
      highPriorityItems,
      onHoldItems,
      itemsPerUser,
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

module.exports = router;
