const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  comparePrice: { type: Number },
  images: [{ type: String }],
  category: { type: String, required: true },
  sku: { type: String }, // Global SKU for simple products
  sizes: [{ type: String }],
  colors: [{ type: String }],
  stock: { type: Number, default: 0 }, // Global stock fallback
  variants: [{
    sku: String,
    size: String,
    color: String,
    stock: { type: Number, default: 0 }
  }],
  tags: [{ type: String }],
  discount: { type: Number, default: 0 },
  fabric: {
    gsm: String,
    material: String
  },
  isFeatured: { type: Boolean, default: false },
  isTrending: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  averageRating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
}, { timestamps: true });

// Performance Indexing
productSchema.index({ slug: 1 });
productSchema.index({ category: 1 });
productSchema.index({ category: 1, createdAt: -1 });
productSchema.index({ name: 'text', tags: 'text' });
productSchema.index({ isFeatured: 1 });

module.exports = mongoose.model('Product', productSchema);
