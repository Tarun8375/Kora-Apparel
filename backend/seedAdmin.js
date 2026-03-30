const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/db');

const seed = async () => {
  await connectDB();
  try {
    const email = process.env.ADMIN_EMAIL || 'admin@kora.com';
    const password = process.env.ADMIN_PASSWORD || 'admin123';

    let admin = await User.findOne({ email });

    if (admin) {
      if (process.env.RESET_ADMIN === 'true') {
        admin.password = password;
        admin.isVerified = true;
        await admin.save();
        console.log(`✅ Admin account (${email}) password has been RESET.`);
      } else {
        console.log(`✅ Admin account (${email}) already exists. Use RESET_ADMIN=true to reset it.`);
      }
    } else {
      await User.create({
        name: 'Kora Admin',
        email,
        password,
        role: 'admin',
        isVerified: true,
      });
      console.log(`✅ Admin account (${email}) created successfully!`);
    }
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
  }
  process.exit(0);
};

seed();
