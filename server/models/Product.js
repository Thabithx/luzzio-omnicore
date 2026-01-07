const mongoose = require('mongoose');
const slugify = require('slugify');

const productSchema = new mongoose.Schema({
   name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
      maxlength: [100, 'Name can not be more than 100 characters']
   },
   slug: String,
   description: {
      type: String,
      required: [true, 'Please add a description'],
      maxlength: [1000, 'Description can not be more than 1000 characters']
   },
   price: {
      type: Number,
      required: [true, 'Please add a price']
   },
   salePrice: {
      type: Number,
      default: 0
   },
   category: {
      type: mongoose.Schema.ObjectId,
      ref: 'Category',
      required: true
   },
   stock: {
      type: Number,
      default: 0
   },
   images: {
      type: [String],
      default: []
   },
   colors: {
      type: [String],
      default: []
   },
   sizes: {
      type: [String],
      default: []
   },
   sizeChart: {
      type: String
   },
   material: {
      type: String,
      trim: true
   },
   reviews: [
      {
         user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: false // Allow guest reviews possibly or require auth
         },
         name: { type: String, required: true },
         email: { type: String, required: true },
         rating: { type: Number, required: true },
         comment: { type: String, required: true },
         images: { type: [String], default: [] },
         createdAt: { type: Date, default: Date.now }
      }
   ],
   rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
   },
   numReviews: {
      type: Number,
      default: 0
   },
   createdAt: {
      type: Date,
      default: Date.now
   }
});

// Create product slug from the name
productSchema.pre('save', async function () {
   this.slug = slugify(this.name, { lower: true });
});

module.exports = mongoose.model('Product', productSchema);
