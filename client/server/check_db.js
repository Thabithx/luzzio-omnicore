const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'server', '.env') });

const Category = require('./models/Category');
const Product = require('./models/Product');

async function check() {
   try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('Connected to MongoDB');

      const categories = await Category.find();
      console.log('Categories:', categories.map(c => ({ id: c._id, name: c.name })));

      const products = await Product.find().populate('categories').populate('category');
      console.log('Total Products:', products.length);

      const newProducts = products.filter(p => {
         if (p.categories?.some(cat => cat.name?.toLowerCase() === 'new')) return true;
         if (p.category?.name?.toLowerCase() === 'new') return true;
         return false;
      });
      console.log('Products in "new" category:', newProducts.length);
      if (newProducts.length > 0) {
         console.log('Sample "new" product:', newProducts[0].name);
      }

      const newArrivalsProducts = products.filter(p => {
         if (p.categories?.some(cat => cat.name?.toLowerCase() === 'new arrivals')) return true;
         if (p.category?.name?.toLowerCase() === 'new arrivals') return true;
         return false;
      });
      console.log('Products in "new arrivals" category:', newArrivalsProducts.length);

      process.exit(0);
   } catch (err) {
      console.error(err);
      process.exit(1);
   }
}

check();
