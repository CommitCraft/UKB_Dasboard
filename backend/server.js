const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const fileUpload = require('express-fileupload');
const path = require('path');
const os = require('os');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const db = require('./src/config/db');
const routes = require('./src/routes');
const { errorHandler } = require('./src/middleware/errorHandler');
const enhancedSystemMonitor = require('./src/utils/enhancedSystemMonitor');

const app = express();

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST_IP || '0.0.0.0';
const isProd = process.env.NODE_ENV === 'production';

// Dynamic local IP for console logs
const networkInterfaces = os.networkInterfaces();
let localIP = 'localhost';
for (const iface of Object.values(networkInterfaces)) {
  for (const info of iface) {
    if (info.family === 'IPv4' && !info.internal) { localIP = info.address; break; }
  }
}

// ─── CORS Whitelist ───────────────────────────────────────────────
const defaultOrigins = 'http://localhost:5173,http://192.168.1.37:8800,http://localhost:8800,http://127.0.0.1:8800';
const allowedOrigins = (process.env.CORS_ORIGIN || defaultOrigins)
  .split(',').map(o => o.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (/^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?$/.test(origin)) return callback(null, true);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// ─── Security Headers ─────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  hsts: isProd ? { maxAge: 31536000, includeSubDomains: true } : false,
  contentSecurityPolicy: false
}));
app.disable('x-powered-by');

// ─── Rate Limiters ────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 300,
  skip: (req) => req.method === 'OPTIONS',
  standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  skip: (req) => req.method === 'OPTIONS',
  standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Please try again in 15 minutes.' }
});

app.use(generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/refresh', authLimiter);

// ─── Performance + Logging ────────────────────────────────────────
app.use(compression());
app.use(morgan(isProd ? 'combined' : 'dev'));

// ─── Body Parsers ─────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// ─── File Uploads ─────────────────────────────────────────────────
app.use(fileUpload({
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 },
  abortOnLimit: true,
  responseOnLimit: 'File size limit exceeded'
}));

// ─── Static Files ─────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Cache-Control: no-store on all API responses ─────────────────
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  enhancedSystemMonitor.incrementApiCall();
  next();
});

// ─── API Routes ───────────────────────────────────────────────────
app.use('/api', routes);

// ─── Health Check (minimal info) ──────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Root ─────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'Aplos Logix MES Management Portal API', version: '1.0.0' });
});

// ─── 404 Handler ──────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// ─── Error Handler (LAST) ─────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────
const startServer = async () => {
  try {
    await db.initializeDatabase();
    const usersCount = await db.execute('SELECT COUNT(*) as count FROM users');
    if (usersCount[0]?.count === 0) {
      console.log('Seeding database...');
      const { seedDatabase } = require('./src/seed/seed');
      await seedDatabase();
    } else {
      console.log('Database connected & verified');
    }
    app.listen(PORT, HOST, () => {
      const displayHost = HOST === '0.0.0.0' ? localIP : HOST;
      console.log(`Aplos Logix MES Backend: http://${displayHost}:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Server start failed:', error.message);
    process.exit(1);
  }
};

process.on('unhandledRejection', (err) => { console.error('Unhandled Rejection:', err.message); process.exit(1); });
process.on('uncaughtException', (err) => { console.error('Uncaught Exception:', err.message); process.exit(1); });
process.on('SIGTERM', () => { console.log('SIGTERM received.'); process.exit(0); });
process.on('SIGINT', () => { console.log('SIGINT received.'); process.exit(0); });

startServer();