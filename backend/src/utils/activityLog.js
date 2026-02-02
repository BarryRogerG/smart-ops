// Note: This utility should use the same PrismaClient instance as the routes
// Import prisma from the route file or pass it as a parameter
// For now, we'll create a function that accepts prisma as a parameter

/**
 * Create an activity log entry for a work item change
 * @param {Object} params
 * @param {Object} params.prisma - PrismaClient instance
 * @param {string} params.workItemId - The work item ID
 * @param {string} params.userId - The user who made the change
 * @param {string} params.action - The action type (created, updated, status_changed, etc.)
 * @param {string} [params.fieldName] - The field that changed (e.g., 'status', 'priority')
 * @param {string} [params.oldValue] - The old value
 * @param {string} [params.newValue] - The new value
 */
async function createActivityLog({ prisma, workItemId, userId, action, fieldName = null, oldValue = null, newValue = null }) {
  try {
    await prisma.activityLog.create({
      data: {
        workItemId,
        userId,
        action,
        fieldName,
        oldValue: oldValue ? String(oldValue) : null,
        newValue: newValue ? String(newValue) : null,
      },
    });
  } catch (error) {
    // Log error but don't throw - activity logging shouldn't break the main operation
    console.error('[ActivityLog] Failed to create activity log:', error);
  }
}

/**
 * Compare old and new work item data and create activity logs for changes
 * @param {Object} params
 * @param {Object} params.prisma - PrismaClient instance
 * @param {Object} params.oldItem - The work item before update
 * @param {Object} params.newItem - The work item after update
 * @param {string} params.userId - The user who made the change
 */
async function logWorkItemChanges({ prisma, oldItem, newItem, userId }) {
  const workItemId = newItem.id;

  // Check each field for changes
  const fieldsToCheck = [
    { key: 'title', action: 'updated' },
    { key: 'description', action: 'updated' },
    { key: 'type', action: 'updated' },
    { key: 'status', action: 'status_changed' },
    { key: 'priority', action: 'priority_changed' },
    { key: 'assignedTo', action: 'assigned' },
    { key: 'projectId', action: 'updated' },
  ];

  for (const { key, action } of fieldsToCheck) {
    const oldVal = oldItem?.[key];
    const newVal = newItem[key];

    // Handle assignedTo specially (null means unassigned)
    if (key === 'assignedTo') {
      if (oldVal !== newVal) {
        if (newVal === null) {
          await createActivityLog({
            prisma,
            workItemId,
            userId,
            action: 'unassigned',
            fieldName: 'assignedTo',
            oldValue: oldVal,
            newValue: null,
          });
        } else {
          await createActivityLog({
            prisma,
            workItemId,
            userId,
            action: 'assigned',
            fieldName: 'assignedTo',
            oldValue: oldVal || 'Unassigned',
            newValue: newVal,
          });
        }
      }
    } else if (oldVal !== newVal) {
      await createActivityLog({
        prisma,
        workItemId,
        userId,
        action,
        fieldName: key,
        oldValue: oldVal,
        newValue: newVal,
      });
    }
  }
}

module.exports = {
  createActivityLog,
  logWorkItemChanges,
};
