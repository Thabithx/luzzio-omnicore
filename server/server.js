const express = require('express'); // server init
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const path = require('path');

dotenv.config();

const app = express();
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
   max: 100, // Limit each IP to 100 requests per windows
   message: 'Too many requests from this IP, please try again after 10 minutes'
});
app.use('/api', limiter);

// Middleware
// Stripe webhook needs raw body for signature verification
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10kb' })); // Body limit
app.use(express.urlencoded({ extended: true })); // Parse application/x-www-form-urlencoded for PayHere

// CORS Configuration
const allowedOrigins = [
   process.env.CLIENT_URL,
   'https://luzziopremium.com', // Explicit production domain
   'http://localhost:5173', // Local development
   'http://localhost:5174'
].filter(Boolean);

const corsOptions = {
   origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
         callback(null, true);
      } else {
         console.warn(`CORS Blocked Origin: ${origin}`);
         callback(new Error('Not allowed by CORS'));
      }
   },
   credentials: true,
   optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

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
