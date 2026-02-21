const express = require('express'); // restart trigger
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const path = require('path');
const compression = require('compression');

dotenv.config();

const app = express();
app.set('trust proxy', true); // Trust all proxies in the chain for Railway/Cloud environments

// CORS Configuration (Must be before all other middleware/routes)
const allowedOrigins = [
   'https://luzziopremium.com',
   'https://www.luzziopremium.com',
   'https://luzzio.vercel.app',
   'http://localhost:5173',
   'http://localhost:5174'
];

if (process.env.CLIENT_URL) {
   allowedOrigins.push(process.env.CLIENT_URL);
}

const corsOptions = {
   origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      const isAllowed = allowedOrigins.some(allowed => origin.startsWith(allowed)) ||
         origin.includes('luzziopremium.com');

      if (isAllowed || process.env.NODE_ENV !== 'production') {
         callback(null, true);
      } else {
         console.warn(`CORS Blocked Origin: ${origin}`);
         callback(new Error('Not allowed by CORS'));
      }
   },
   credentials: true,
   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
   allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
   optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(compression()); // Register early for global activation
const PORT = process.env.PORT || 5001;

// Database Connection
const connectDB = async () => {
   let mongoUri = process.env.MONGO_URI;

   try {
      if (mongoUri) {
         console.log('Attempting to connect to MongoDB...');
         await mongoose.connect(mongoUri);
         console.log('Connected to MongoDB');
      } else {
         console.error('Error: MONGO_URI is not defined in .env');
         process.exit(1);
      }
   } catch (err) {
      console.error('MongoDB connection failed:', err);
      process.exit(1);
   }
};

connectDB();

// Security Middleware
app.use(helmet());
app.use(mongoSanitize());
app.use(hpp());

// Rate Limiting
const limiter = rateLimit({
   windowMs: 10 * 60 * 1000, // 10 minutes
   max: 1000, // High ceiling to prevent SPA burst issues during testing
   message: 'Too many requests from this IP, please try again after 10 minutes',
   standardHeaders: true,
   legacyHeaders: false,
   keyGenerator: (req) => {
      // Prioritize X-Forwarded-For provided by Railway/Load Balancer
      return req.headers['x-forwarded-for']?.split(',')[0] || req.ip || req.connection.remoteAddress;
   },
});
app.use('/api', limiter);

// Middleware
// Stripe webhook needs raw body for signature verification
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10kb' })); // Body limit
app.use(express.urlencoded({ extended: true })); // Parse application/x-www-form-urlencoded for PayHere

// Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const newsletterRoutes = require('./routes/newsletterRoutes');
const contactRoutes = require('./routes/contactRoutes');
const faqRoutes = require('./routes/faqRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const fadarRoutes = require('./routes/fadarRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const feedController = require('./controllers/feedController');

app.get('/facebook-product-feed', feedController.getFacebookFeed);

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/faq', faqRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/fadar', fadarRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);

// Base route
app.get('/', (req, res) => {
   res.send('Luzzio API is running...');
});

// Create a global error handling middleware
app.use((err, req, res, next) => {
   console.error(err.stack);
   res.status(500).json({
      status: 'error',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
   });
});


// Start Server
app.listen(PORT, () => {
   console.log(`Server running on port ${PORT}`);
});
