const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const email = process.argv[2];

if (!email) {
   console.error('Please provide an email address. Example: node makeAdmin.js user@example.com');
   process.exit(1);
}

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
   console.error('MONGO_URI is missing in .env file');
   process.exit(1);
}

mongoose.connect(mongoUri)
   .then(async () => {
      console.log('Connected to MongoDB');
      const normalizedEmail = email.trim().toLowerCase();
      const user = await User.findOne({ email: normalizedEmail });
      
      if (!user) {
         console.error(`User with email "${normalizedEmail}" not found. Make sure you register this user first via the website Sign Up page.`);
         process.exit(1);
      }

      user.role = 'admin';
      await user.save();
      console.log(`\n🎉 Success! User "${normalizedEmail}" has been promoted to Admin.`);
      process.exit(0);
   })
   .catch(err => {
      console.error('Database connection failed:', err);
      process.exit(1);
   });
