const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware (Stripe webhook needs raw body for signature verification)
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(cors());

// Database Connection
const { seedDatabaseInternal } = require('./controllers/seedController');

const seedDatabase = async () => {
   try {
      const Product = require('./models/Product');
      const count = await Product.countDocuments();
      if (count === 0) {
         console.log('Database empty. Auto-seeding...');
         await seedDatabaseInternal();
         console.log('Auto-seed successful.');
      }
   } catch (err) {
      console.error('Auto-seed error:', err);
   }
};

const connectDB = async () => {
   let mongoUri = process.env.MONGO_URI;

   try {
      if (mongoUri) {
         console.log('Attempting to connect to Local MongoDB...');
         // Try connecting with a 3-second timeout to avoid long hangs
         await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 3000,
         });
         console.log('Connected to Local MongoDB');
      } else {
         throw new Error('No MONGO_URI provided');
      }
   } catch (err) {
      console.warn('Local MongoDB connection failed. Falling back to In-Memory MongoDB...');
      try {
         const { MongoMemoryServer } = require('mongodb-memory-server');
         const mongod = await MongoMemoryServer.create();
         const memoryUri = mongod.getUri();
         await mongoose.connect(memoryUri);
         console.log('Connected to In-Memory MongoDB');
      } catch (memErr) {
         console.error('Critical Error: Could not connect to any database:', memErr);
         process.exit(1);
      }
   }

   await seedDatabase();
};

connectDB();

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

// Seeding Route (Dev Only)
const seedController = require('./controllers/seedController');
app.post('/api/seed', seedController.seedDatabase);

const path = require('path');

// ... existing routes ...

// Serve Frontend in Production
app.get('/', (req, res) => {
   res.send('Luzzio API is running...');
});

// Start Server
app.listen(PORT, () => {
   console.log(`Server running on port ${PORT}`);
});
