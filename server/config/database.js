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
