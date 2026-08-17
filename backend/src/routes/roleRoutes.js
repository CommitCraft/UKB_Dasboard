const express = require('express');
const router = express.Router();

const RoleController = require('../controllers/roleController');
const { auth, requireAdmin, requireAssignedPage } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { activityLogger, responseTimeLogger } = require('../middleware/activityLogger');
const {
  createRoleValidation,
  updateRoleValidation,
  roleIdValidation,
  paginationValidation
} = require('../middleware/validation');

// Apply authentication and response time logging to all role routes
router.use(auth);
router.use(responseTimeLogger);

// Get all roles (simple list for dropdowns) - Authenticated users
router.get('/simple',
  activityLogger('view', 'role'),
  RoleController.getAllSimple
);

// Get all roles with pagination - Requires specific '/roles' assigned permission
router.get('/',
  paginationValidation,
  requireAssignedPage('/roles'),
  checkPermission('view', 'role'),
  activityLogger('view', 'role'),
  RoleController.getRoles
);

// Get role statistics - Admin only
router.get('/stats',
  requireAdmin,
  checkPermission('view', 'role'),
  activityLogger('view', 'role_stats'),
  RoleController.getStats
);

// Get role by ID - Requires specific '/roles' assigned permission
router.get('/:id',
  roleIdValidation,
  requireAssignedPage('/roles'),
  checkPermission('view', 'role'),
  activityLogger('view', 'role'),
  RoleController.getRoleById
);

// Create new role - Requires specific '/roles' assigned permission
router.post('/',
  createRoleValidation,
  requireAssignedPage('/roles'),
  checkPermission('create', 'role'),
  activityLogger('create', 'role'),
  RoleController.createRole
);

// Update role - Requires specific '/roles' assigned permission
router.put('/:id',
  updateRoleValidation,
  requireAssignedPage('/roles'),
  checkPermission('update', 'role'),
  activityLogger('update', 'role'),
  RoleController.updateRole
);

// Delete role - Requires specific '/roles' assigned permission
router.delete('/:id',
  roleIdValidation,
  requireAssignedPage('/roles'),
  checkPermission('delete', 'role'),
  activityLogger('delete', 'role'),
  RoleController.deleteRole
);

module.exports = router;