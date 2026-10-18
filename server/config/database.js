const mongoose = require('mongoose');
const dns = require('dns');

// Configure reliable DNS servers for Atlas SRV resolution on macOS/local dev
try {
   dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
   // Ignore in environments where setting DNS servers is restricted
}

// Disable buffering so DB operations fail immediately (not after 10s timeout)
// when Mongoose is not connected. This gives instant clear errors.
mongoose.set('bufferCommands', false);

let devMode = false;

async function connectDB() {
   const mongoUri = process.env.MONGO_URI;

   if (!mongoUri) {
      devMode = true;
      console.warn('⚠️  MONGO_URI is not set in environment variables — running in dev/offline mode');
      return;
   }

   try {
      // Log a redacted version of the URI so we can confirm it's being read
      const redacted = mongoUri.replace(/:([^@]+)@/, ':***@');
      console.log(`Connecting to MongoDB: ${redacted}`);
      await mongoose.connect(mongoUri, {
         serverSelectionTimeoutMS: 10000,
         connectTimeoutMS: 10000,
      });
      console.log(' Connected to MongoDB successfully');


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
