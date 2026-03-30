const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, minlength: 6 },
  otp: { type: String },
  otpExpires: { type: Date },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  addresses: [{
    label: String,
    line1: String,
    line2: String,
    city: String,
    state: String,
    pincode: String,
    phone: String,
  }],
  cart: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    price: Number,
    image: String,
    size: String,
    color: String,
    qty: { type: Number, default: 1 }
  }],
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  isBlocked: { type: Boolean, default: false },
  totalSpend: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  // Smart Hashing: Check if the password is already a bcrypt hash
  // (Bcrypt hashes start with $2a$, $2b$, or $2y$ and are 60 chars long)
  const isHashed = /^\$2[aby]\$[0-9]{2}\$[./A-Za-z0-9]{53}$/.test(this.password);
  
  if (!isHashed) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
