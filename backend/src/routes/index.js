const express = require('express');
const router = express.Router();

// Import all route modules
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const roleRoutes = require('./roleRoutes');
const pageRoutes = require('./pageRoutes');
const menuRoutes = require('./menuRoutes');
const statsRoutes = require('./statsRoutes');
const exportRoutes = require('./exportRoutes');
const systemRoutes = require('./systemRoutes');
const { auth, requireAdmin } = require('../middleware/auth');

// API root — minimal info, no endpoint enumeration
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Aplos Logix MES Management Portal API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API status — admin only, minimal info
router.get('/status', auth, requireAdmin, (req, res) => {
  res.json({
    success: true,
    status: 'operational',
    timestamp: new Date().toISOString()
  });
});

// Mount all routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/pages', pageRoutes);
router.use('/menus', menuRoutes);
router.use('/stats', statsRoutes);
router.use('/exports', exportRoutes);
router.use('/system', systemRoutes);

// API docs — admin only
router.get('/docs', auth, requireAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'API Documentation — restricted to administrators'
  });
});

module.exports = router;