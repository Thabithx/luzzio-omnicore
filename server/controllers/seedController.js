const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');

const seedDatabaseInternal = async () => {
   await User.deleteMany();
   await Category.deleteMany();
   await Product.deleteMany();

   const admin = await User.create({
      name: 'Admin User',
      email: process.env.ADMIN_EMAIL || 'admin@luzzio.com',
      password: process.env.ADMIN_PASSWORD || 'password123',
      role: 'admin'
   });

   const categories = await Category.create([
      { name: 'Ready to Wear', description: 'Luxury apparel' },
      { name: 'Shoes', description: 'Designer footwear' },
      { name: 'Bags', description: 'High-end leather goods' },
      { name: 'Accessories', description: 'Jewelry and eyewear' }
   ]);

   const products = await Product.create([
      {
         name: "Oversized Wool Blazer",
         description: "Double-breasted blazer in black structured wool. Made in Italy.",
         price: 2290,
         category: categories[0]._id,
         stock: 12,
         sizes: ['S', 'M', 'L'],
         images: ["https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=800"],
         rating: 5
      },
      {
         name: "Wide Leg Gabardine Trousers",
         description: "High-waisted wide-leg trousers in beige cotton gabardine.",
         price: 850,
         category: categories[0]._id,
         stock: 15,
         sizes: ['S', 'M', 'L'],
         images: ["https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=800"],
         rating: 4
      },
      {
         name: "Track Sneaker in Silver",
         description: "Multi-panel sneaker with mesh and nylon in metallic silver.",
         price: 1150,
         category: categories[1]._id,
         stock: 20,
         sizes: ['M', 'L', 'XL'],
         images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800"],
         rating: 5
      },
      {
         name: "Hourglass Handbag XS",
         description: "Curvilinear-shaped XS handbag in shiny crocodile-embossed calfskin.",
         price: 2750,
         category: categories[2]._id,
         stock: 5,
         sizes: ['S'],
         images: ["https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=800"],
         rating: 5
      },
      {
         name: "Knife Pump 110mm",
         description: "Pointed-toe pump in black stretch jersey. Made in Italy.",
         price: 950,
         category: categories[1]._id,
         stock: 10,
         sizes: ['S', 'M', 'L'],
         images: ["https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=800"],
         rating: 4
      }
   ]);

   return products;
};

exports.seedDatabase = async (req, res) => {
   try {
      const products = await seedDatabaseInternal();
      res.status(200).json({
         success: true,
         count: products.length,
         message: 'Database Seeded Successfully'
      });
   } catch (err) {
      res.status(500).json({ success: false, message: err.message });
   }
};

exports.seedDatabaseInternal = seedDatabaseInternal;
