const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config({ path: './server/.env' });

mongoose.connect(process.env.MONGO_URI, {
   useNewUrlParser: true,
   useUnifiedTopology: true
}).then(async () => {
   console.log('MongoDB Connected');

   const adminExists = await User.findOne({ email: 'admin@luzzio.com' });
   
   if (adminExists) {
      console.log('Admin user already exists. Overriding password to: password123');
      adminExists.password = 'password123';
      adminExists.role = 'admin';
      await adminExists.save();
      console.log('Admin password updated.');
   } else {
      console.log('Creating new admin user: admin@luzzio.com / password123');
      const adminUser = new User({
         name: 'Admin',
         email: 'admin@luzzio.com',
         password: 'password123',
         role: 'admin'
      });
      await adminUser.save();
      console.log('Admin user created.');
   }
   
   process.exit();
}).catch(err => {
   console.error(err);
   process.exit(1);
});
