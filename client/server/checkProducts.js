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

const checkProducts = async () => {
   try {
      await connectDB();

      const db = mongoose.connection.db;
      const collection = db.collection('products');

      const totalCount = await collection.countDocuments();
      console.log(`\n📦 Total products in database: ${totalCount}\n`);

      const products = await collection.find({})
         .sort({ createdAt: -1 })
         .project({ name: 1, createdAt: 1, stock: 1, price: 1 })
         .toArray();

      console.log('Products (newest first):');
      console.log('═'.repeat(80));
      products.forEach((p, idx) => {
         const date = new Date(p.createdAt).toLocaleString();
         console.log(`${idx + 1}. ${p.name}`);
         console.log(`   ID: ${p._id}`);
         console.log(`   Created: ${date}`);
         console.log(`   Price: LKR ${p.price} | Stock: ${p.stock}`);
         console.log('─'.repeat(80));
      });

      process.exit(0);
   } catch (err) {
      console.error('Error checking products:', err);
      process.exit(1);
   }
};

checkProducts();
