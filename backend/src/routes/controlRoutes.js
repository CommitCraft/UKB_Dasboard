const express = require('express');
const router = express.Router();
const controlController = require('../controllers/controlController');
const { auth, requireSuperAdmin } = require('../middleware/auth');
const { activityLogger } = require('../middleware/activityLogger');

// All control routes STRICTLY require authentication AND super_admin role
router.use(auth);
router.use(requireSuperAdmin);

// GET /api/control/status — Live project telemetry & PM2 status
router.get(
  '/status',
  (req, res) => controlController.getProjectStatus(req, res)
);

// POST /api/control/action — Execute start, stop, restart, or status
router.post(
  '/action',
  activityLogger('execute', 'control_action'),
  (req, res) => controlController.executeControlAction(req, res)
);

module.exports = router;
