const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Database Connection
const connectDB = async () => {
   let mongoUri = process.env.MONGO_URI;

   try {
      if (mongoUri) {
         console.log('Connecting to MongoDB...');
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

const dropProductNameIndex = async () => {
   try {
      await connectDB();

      const db = mongoose.connection.db;
      const collection = db.collection('products');

      console.log('Attempting to drop name_1 index...');
      await collection.dropIndex('name_1');
      console.log('✓ Successfully dropped name_1 index');
      console.log('Products can now have duplicate names');

      process.exit(0);
   } catch (err) {
      if (err.code === 27 || err.message.includes('index not found')) {
         console.log('Index name_1 does not exist (already dropped or never created)');
         process.exit(0);
      } else {
         console.error('Error dropping index:', err);
         process.exit(1);
      }
   }
};

dropProductNameIndex();
