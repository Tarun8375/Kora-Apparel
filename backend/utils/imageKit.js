const ImageKit = require('imagekit');

// Initialize ImageKit with credentials from .env
let imagekit = null;

try {
  if (process.env.IMAGEKIT_PUBLIC_KEY && process.env.IMAGEKIT_PRIVATE_KEY && process.env.IMAGEKIT_URL_ENDPOINT) {
    imagekit = new ImageKit({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
    });
    console.log('✅ ImageKit initialized successfully.');
  } else {
    console.warn('⚠️ ImageKit credentials missing in .env. Image uploading may fail.');
  }
} catch (err) {
  console.error('❌ Failed to initialize ImageKit:', err);
}

module.exports = imagekit;
