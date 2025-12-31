const mongoose = require('mongoose');
const slugify = require('slugify');

const productSchema = new mongoose.Schema({
   name: {
      type: String,
      required: [true, 'Please add a name'],
      unique: true,
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
      enum: ['XS', 'S', 'M', 'L', 'XL'],
      default: ['S', 'M', 'L']
   },
   material: {
      type: String,
      trim: true
   },
   rating: {
      type: Number,
      min: 1,
      max: 5
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
