const mongoose = require('mongoose');
const dotenv = require('dotenv');
const colors = require('colors');
const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');
const { MongoMemoryServer } = require('mongodb-memory-server');

dotenv.config();

const seedData = async () => {
   try {
      // Connect to DB (Using logic similar to server.js for consistency/standalone)
      // BUT since server is running with In-Memory, we can't easily connect to THAT separate process's memory DB 
      // unless we expose it or run this INSIDE the server process.
      // simpler approach: modify `server.js` to have a /api/seed endpoint provided only in dev.

      // Actually, for verification script, we can just use the register endpoint to make a user, 
      // but we need an ADMIN. 
      // So making a temporary /api/seed endpoint to server.js is the most reliable way to seed the RUNNING memory db.
      console.log("Seeding logic will be handled via API endpoint.");
   } catch (err) {
      console.error(err);
   }
};
