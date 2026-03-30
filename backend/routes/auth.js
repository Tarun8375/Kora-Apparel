const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Verification = require('../models/Verification');
const Notification = require('../models/Notification');
const bcrypt = require('bcryptjs');
const { protect } = require('../middleware/auth');
const sendEmail = require('../utils/sendEmail');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

const sendTokenResponse = (user, res) => {
  const token = generateToken(user._id);
  const options = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  };

  res.cookie('jwt', token, options);
  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    cart: user.cart || []
  });
};

// ================= ADMIN FLOWS =================

// @POST /api/auth/admin/login
router.post('/admin/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const emailStr = String(email);
    const user = await User.findOne({ email: emailStr });
    if (!user || user.role !== 'admin') return res.status(401).json({ message: 'Invalid admin credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid admin credentials' });

    sendTokenResponse(user, res);
  } catch (err) { next(err); }
});

// @POST /api/auth/admin/forgot-password
router.post('/admin/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email, role: 'admin' });
    if (!user) return res.status(404).json({ message: 'Admin not found with that email' });

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/admin-reset-password?token=${resetToken}`;
    
    await sendEmail({
      email: user.email,
      subject: 'Admin Password Reset Request',
      message: `You requested a password reset. Please click on the following link or paste it into your browser to complete the process: \n\n ${resetUrl}`,
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f0f0f0; padding: 48px; border-radius: 16px; color: #1a1a1a; line-height: 1.6;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="font-size: 28px; font-weight: 700; letter-spacing: 4px; border-bottom: 2px solid #1a1a1a; display: inline-block; padding-bottom: 8px; margin: 0;">KORA</h1>
            <p style="font-size: 10px; font-bold; text-transform: uppercase; letter-spacing: 2px; color: #999; margin-top: 8px;">Administrative Control</p>
          </div>
          <p style="font-size: 16px; margin-bottom: 24px;">Greetings,</p>
          <p style="font-size: 16px; margin-bottom: 32px;">A credential reset was requested for your administrative access. If this was intentional, please proceed using the link below:</p>
          <div style="text-align: center; margin: 40px 0;">
            <a href="${resetUrl}" style="display: inline-block; background-color: #1a1a1a; color: #fff; text-decoration: none; padding: 18px 36px; border-radius: 8px; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; transition: background 0.3s;">Verify & Reset Password</a>
          </div>
          <p style="font-size: 14px; color: #666; font-style: italic; margin-top: 40px; border-top: 1px solid #eee; pt: 20px;">If you did not initiate this request, no action is required. Your account remains secure.</p>
        </div>
      `
    });

    res.json({ message: 'Password reset link sent to email' });
  } catch (err) { next(err); }
});

// @POST /api/auth/admin/reset-password
router.post('/admin/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: 'Token and new password required' });

    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
      role: 'admin'
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) { next(err); }
});

// ================= USER FLOWS =================

// @POST /api/auth/register (Create verification record)
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'All fields required' });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    // Securely hash the password immediately (Security Best Practice)
    const hashedPassword = await bcrypt.hash(password, 12);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    // Update or create verification record - STORE HASHED PASSWORD
    await Verification.findOneAndUpdate(
      { email },
      { name, password: hashedPassword, otp, otpExpires, type: 'signup' },
      { upsert: true, new: true }
    );

    await sendEmail({
      email,
      subject: 'Verify your Kora Apparel account',
      message: `Your verification code is: ${otp}\n\nThis code will expire in 10 minutes.`,
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f0f0f0; padding: 48px; border-radius: 20px; color: #1a1a1a; line-height: 1.6; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="font-size: 32px; font-weight: 800; letter-spacing: 6px; margin: 0; color: #000;">KORA</h1>
            <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 3px; color: #888; margin-top: 10px;">Modern Luxury Apparel</p>
          </div>
          <p style="font-size: 18px; font-weight: 600; margin-bottom: 16px;">Welcome to the Inner Circle, ${name}.</p>
          <p style="font-size: 15px; color: #444; margin-bottom: 32px;">To complete your registration and unlock exclusive access, please use the following verification code:</p>
          <div style="background-color: #f8f8f8; padding: 24px; border-radius: 12px; margin: 32px 0; text-align: center;">
            <div style="font-size: 32px; font-weight: 800; letter-spacing: 12px; color: #1a1a1a; font-family: monospace; margin-left: 12px;">${otp}</div>
          </div>
          <p style="font-size: 13px; color: #999; margin-top: 40px; text-align: center;">This code is valid for 10 minutes. For your security, please do not share this with anyone.</p>
        </div>
      `
    });

    res.status(200).json({ message: 'Verification code sent to your email.' });
  } catch (err) { next(err); }
});

// @POST /api/auth/verify-email
router.post('/verify-email', async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and verification code required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isBlocked) return res.status(403).json({ message: 'Account blocked' });

    if (user.otp !== otp) return res.status(400).json({ message: 'Invalid verification code' });
    if (new Date() > new Date(user.otpExpires)) return res.status(400).json({ message: 'Code has expired' });

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully. You can now login.' });
  } catch (err) { next(err); }
});

// @POST /api/auth/send-otp (User Magic Login/Signup)
router.post('/send-otp', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });

    const user = await User.findOne({ email });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    if (user && user.isBlocked) return res.status(403).json({ message: 'Account blocked' });

    // Store OTP in Verification model (for both existing and new users)
    await Verification.findOneAndUpdate(
      { email },
      { otp, otpExpires, type: user ? 'login' : 'signup' },
      { upsert: true }
    );

    await sendEmail({
      email,
      subject: 'Your Kora Apparel Login Code',
      message: `Your login code is: ${otp}`,
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 550px; margin: 0 auto; border: 1px solid #f3f3f3; padding: 60px 40px; border-radius: 24px; color: #1a1a1a; line-height: 1.6; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.02);">
          <div style="margin-bottom: 50px;">
            <h1 style="font-size: 32px; font-weight: 800; letter-spacing: 8px; margin: 0; color: #000; text-transform: uppercase;">KORA</h1>
          </div>
          <p style="font-size: 16px; color: #666; margin-bottom: 30px; font-weight: 500;">Secure Identity Verification</p>
          <div style="background: linear-gradient(135deg, #f9f9f9 0%, #ffffff 100%); border: 1px solid #eeeeee; padding: 30px 20px; border-radius: 16px; margin: 0 0 40px 0;">
            <div style="font-size: 36px; font-weight: 800; letter-spacing: 14px; color: #000; font-family: 'Courier New', monospace; margin-left: 14px;">${otp}</div>
          </div>
          <p style="font-size: 14px; color: #888; margin-bottom: 0;">Use this code to complete your sign-in.</p>
          <div style="margin-top: 60px; border-top: 1px solid #f0f0f0; padding-top: 30px;">
            <p style="font-size: 10px; color: #ccc; text-transform: uppercase; letter-spacing: 2px;">© 2024 Kora Apparel. All Rights Reserved.</p>
          </div>
        </div>
      `
    });

    res.json({ message: 'Verification code sent!' });
  } catch (err) { next(err); }
});

// @POST /api/auth/verify-otp (Verify & Login/Signup)
router.post('/verify-otp', async (req, res, next) => {
  try {
    const { email, otp, localCart } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and code required' });

    const verifyRec = await Verification.findOne({ email });
    if (!verifyRec) return res.status(404).json({ message: 'Verification session expired' });

    if (verifyRec.otp !== otp) return res.status(400).json({ message: 'Invalid code' });
    if (new Date() > new Date(verifyRec.otpExpires)) return res.status(400).json({ message: 'Code expired' });

    let user = await User.findOne({ email });

    if (!user && verifyRec.type === 'signup') {
      // Create user after verification
      user = await User.create({
        email,
        name: verifyRec.name || email.split('@')[0],
        password: verifyRec.password, // already hashed in register route
        role: 'user',
        isVerified: true
      });

      await Notification.create({
        title: 'New Member Joined',
        message: `${user.name} (${email}) joined Kora Apparel.`,
        type: 'user',
        link: '/admin/users'
      });
    } else if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (user.isBlocked) return res.status(403).json({ message: 'Account blocked' });

    // Mark as verified
    user.isVerified = true;

    // Merge Cart if needed
    if (localCart && Array.isArray(localCart)) {
      const dbCart = user.cart || [];
      const mergedCartMap = new Map();
      dbCart.forEach(item => mergedCartMap.set(`${item.product}-${item.size}-${item.color}`, item));
      localCart.forEach(localItem => {
        const prodId = localItem.product._id || localItem.product;
        const id = `${prodId}-${localItem.size}-${localItem.color}`;
        if (mergedCartMap.has(id)) {
          mergedCartMap.get(id).qty += localItem.qty;
        } else {
          mergedCartMap.set(id, {
            product: prodId,
            name: localItem.name,
            price: localItem.price,
            image: localItem.image,
            size: localItem.size,
            color: localItem.color,
            qty: localItem.qty
          });
        }
      });
      user.cart = Array.from(mergedCartMap.values());
    }

    await user.save();
    await verifyRec.deleteOne(); // Cleanup

    sendTokenResponse(user, res);
  } catch (err) { next(err); }
});

// @POST /api/auth/login (Existing Password Login)
router.post('/login', async (req, res, next) => {
  try {
    const { email, password, localCart } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    if (user.isBlocked) return res.status(403).json({ message: 'Account blocked' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    if (!user.isVerified && user.role === 'user') {
      return res.status(403).json({ message: 'Please verify your email before logging in', needsVerification: true });
    }

    if (localCart && Array.isArray(localCart)) {
      const dbCart = user.cart || [];
      const mergedCartMap = new Map();

      dbCart.forEach(item => mergedCartMap.set(`${item.product}-${item.size}-${item.color}`, item));

      localCart.forEach(localItem => {
        const id = `${localItem.product._id || localItem.product}-${localItem.size}-${localItem.color}`;
        if (mergedCartMap.has(id)) {
          const existing = mergedCartMap.get(id);
          existing.qty += localItem.qty;
        } else {
          mergedCartMap.set(id, {
            product: localItem.product._id || localItem.product,
            name: localItem.name,
            price: localItem.price,
            image: localItem.image,
            size: localItem.size,
            color: localItem.color,
            qty: localItem.qty
          });
        }
      });

      user.cart = Array.from(mergedCartMap.values());
      await user.save();
    }

    sendTokenResponse(user, res);
  } catch (err) { next(err); }
});

// @GET /api/auth/me
router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (err) { next(err); }
});

// @PUT /api/auth/me
router.put('/me', protect, async (req, res, next) => {
  try {
    const { name, addresses } = req.body;
    const user = await User.findById(req.user._id);
    if (name) user.name = name;
    if (addresses) user.addresses = addresses;
    await user.save();
    res.json({ _id: user._id, name: user.name, email: user.email, addresses: user.addresses });
  } catch (err) { next(err); }
});

// @PUT /api/auth/cart
router.put('/cart', protect, async (req, res, next) => {
  try {
    const { cart } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.cart = cart.map(item => ({
      product: item.product._id || item.product,
      name: item.name,
      price: item.price,
      image: item.image,
      size: item.size,
      color: item.color,
      qty: item.qty
    }));
    await user.save();
    res.json({ cart: user.cart });
  } catch (err) { next(err); }
});

// @GET /api/auth/me/wishlist
router.get('/me/wishlist', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist', 'name images price comparePrice slug status');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ wishlist: user.wishlist || [] });
  } catch (err) { next(err); }
});

// @PUT /api/auth/me/wishlist
router.put('/me/wishlist', protect, async (req, res, next) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ message: 'Product ID required' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const index = user.wishlist.findIndex(id => id.toString() === productId);
    if (index === -1) {
      user.wishlist.push(productId);
    } else {
      user.wishlist.splice(index, 1);
    }

    await user.save();
    
    const populatedUser = await User.findById(req.user._id).populate('wishlist', 'name images price comparePrice slug status');
    res.json({ wishlist: populatedUser.wishlist || [] });
  } catch (err) { next(err); }
});

// @PUT /api/auth/password
router.put('/password', protect, async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return res.status(400).json({ message: 'Old and new passwords required' });

    const user = await User.findById(req.user._id);
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) return res.status(401).json({ message: 'Incorrect current password' });

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) { next(err); }
});

// @PUT /api/auth/addresses
router.put('/addresses', protect, async (req, res, next) => {
  try {
    const { addresses } = req.body;
    if (!Array.isArray(addresses)) return res.status(400).json({ message: 'Addresses must be an array' });

    const user = await User.findById(req.user._id);
    user.addresses = addresses;
    await user.save();
    res.json({ addresses: user.addresses });
  } catch (err) { next(err); }
});

// @POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No account found with this email' });

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    
    await sendEmail({
      email: user.email,
      subject: 'Kora Apparel - Password Reset Request',
      message: `You requested a password reset. Please use the following link to reset your password: ${resetUrl}`,
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f0f0f0; padding: 48px; border-radius: 16px; color: #1a1a1a; line-height: 1.6;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="font-size: 28px; font-weight: 700; letter-spacing: 4px; border-bottom: 2px solid #1a1a1a; display: inline-block; padding-bottom: 8px; margin: 0;">KORA</h1>
          </div>
          <p style="font-size: 16px; margin-bottom: 24px;">Greetings,</p>
          <p style="font-size: 16px; margin-bottom: 32px;">A password reset was requested for your Kora Apparel account. To proceed, please use the button below:</p>
          <div style="text-align: center; margin: 40px 0;">
            <a href="${resetUrl}" style="display: inline-block; background-color: #1a1a1a; color: #fff; text-decoration: none; padding: 18px 36px; border-radius: 8px; font-weight: 600; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Reset Password</a>
          </div>
          <p style="font-size: 14px; color: #666; font-style: italic; margin-top: 40px; border-top: 1px solid #eee; pt: 20px;">If you did not initiate this request, you can safely ignore this email.</p>
        </div>
      `
    });

    res.json({ message: 'Reset link dispatched to your email' });
  } catch (err) { next(err); }
});

// @POST /api/auth/reset-password
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: 'Token and new password required' });

    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: 'Password updated successfully. You can now login.' });
  } catch (err) { next(err); }
});

// @POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.cookie('jwt', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  });
  res.status(200).json({ message: 'Logged out successfully' });
});

module.exports = router;
