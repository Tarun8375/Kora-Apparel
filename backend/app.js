/**
 * app.js — Express application factory (no DB connection, no listen).
 * 
 * Splitting the app from server.js allows Supertest to import the Express
 * instance without triggering MongoDB connection or port binding.
 * server.js keeps the actual startup logic.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');
const errorHandler = require('./middleware/error');

// Routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const dropRoutes = require('./routes/drops');
const reviewRoutes = require('./routes/reviews');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const bannerRoutes = require('./routes/banners');
const couponRoutes = require('./routes/coupons');
const settingRoutes = require('./routes/settings');
const testimonialRoutes = require('./routes/testimonials');
const categoryRoutes = require('./routes/categories');
const notificationRoutes = require('./routes/notifications');
const contactRoutes = require('./routes/contact');
const newsletterRoutes = require('./routes/newsletter');
const Notification = require('./models/Notification');

const app = express();

// Trust Proxy for accurate IP retrieval behind Render's load balancers
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate limiting (relaxed for tests)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 10000 : 1000,
  message: 'Too many requests, please try again later.',
});
app.use('/api/', limiter);

// CORS & CSRF Origin Protection
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3001',
  'https://kora-apparel-frontend.onrender.com'
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// Strict CSRF Mitigator: Native browsers will always send Origin for cross-origin POSTs.
app.use((req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const origin = req.headers.origin;
    // We allow same-origin requests (no origin header in some scenarios) or matched origin
    if (origin && !allowedOrigins.includes(origin)) {
      return res.status(403).json({ message: 'CSRF Forbidden: Origin mismatch' });
    }
  }
  next();
});

// Body & Cookie parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Direct notification routes
const { protect, adminOnly } = require('./middleware/auth');

app.delete('/api/notifications/remove/:id', protect, adminOnly, async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: 'Removed' });
  } catch (err) { res.status(500).json(err); }
});

app.delete('/api/notifications/clear-all', protect, adminOnly, async (req, res) => {
  try {
    await Notification.deleteMany({});
    res.json({ message: 'Cleared All' });
  } catch (err) { res.status(500).json(err); }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/drops', dropRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/newsletter', newsletterRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

// 404 handler
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// Global error handler
app.use(errorHandler);

module.exports = app;
