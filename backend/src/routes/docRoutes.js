const express = require('express');
const router = express.Router();
const docController = require('../controllers/docController');
const { auth, requireSuperAdmin } = require('../middleware/auth');
const { responseTimeLogger } = require('../middleware/activityLogger');

// Apply response time logger
router.use(responseTimeLogger);

// All documentation routes are strictly restricted to Super Admin
router.use(auth);
router.use(requireSuperAdmin);

// GET /api/docs/sections - Get complete system documentation
router.get('/sections', (req, res) => docController.getDocumentation(req, res));

// GET /api/docs - Alias for compatibility
router.get('/', (req, res) => docController.getDocumentation(req, res));

module.exports = router;
