const mongoose = require('mongoose');

let devMode = false;

async function connectDB() {
   const mongoUri = process.env.MONGO_URI;

   if (!mongoUri) {
      devMode = true;
      console.warn('MONGO_URI missing — using local dev catalog');
      return;
   }

   try {
      console.log('Attempting to connect to MongoDB...');
      await mongoose.connect(mongoUri);
      console.log('Connected to MongoDB');

      // Auto-seed default admin user if not exists (THABITH SRIHARAN)
      const User = require('../models/User');
      const adminExists = await User.findOne({ email: 'admin@luzzio.com' });
      if (!adminExists) {
         console.log('Auto-creating default admin user: admin@luzzio.com / password123');
         await User.create({
            name: 'Admin',
            email: 'admin@luzzio.com',
            password: 'password123',
            role: 'admin'
         });
         console.log('Default admin user successfully seeded.');
      }
   } catch (err) {
      console.error('MongoDB connection failed:', err.message);
      devMode = true;
      console.warn('Using local dev catalog (MongoDB unavailable)');
   }
}

function isDevStore() {
   return devMode;
}

module.exports = { connectDB, isDevStore };
