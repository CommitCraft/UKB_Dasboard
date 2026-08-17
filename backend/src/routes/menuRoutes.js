const express = require('express');
const router = express.Router();
const MenuController = require('../controllers/menuController');
const { auth, requireAdmin } = require('../middleware/auth');

// Protect all menu management endpoints (Admin / Super Admin / Authenticated Users)
router.use(auth);

// Get full menu tree (Available to logged in users to render sidebar)
router.get('/tree', MenuController.getMenuTree);

// Create, Edit, Delete, Reorder (Super Admin / Admin only)
router.post('/', requireAdmin, MenuController.createMenuItem);
router.put('/reorder', requireAdmin, MenuController.reorderMenuItems);
router.put('/:id', requireAdmin, MenuController.updateMenuItem);
router.delete('/:id', requireAdmin, MenuController.deleteMenuItem);
router.patch('/:id/toggle-status', requireAdmin, MenuController.toggleMenuItemStatus);

module.exports = router;
