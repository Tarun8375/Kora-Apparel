const multer = require('multer');
const path = require('path');
const imagekit = require('../utils/imageKit'); // Utilizing new ImageKit integration

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mime = allowedTypes.test(file.mimetype);
  if (ext && mime) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

const processImages = async (req, res, next) => {
  const files = req.files ? req.files : (req.file ? [req.file] : []);
  if (files.length === 0) return next();

  try {
    const filenames = [];
    
    // Ensure ImageKit is alive
    if (!imagekit) {
      console.warn('ImageKit not configured. Failing gracefully.');
      return next(new Error('Image Storage Backend Not Configured (ImageKit)'));
    }

    for (const file of files) {
      // Create a web-safe name
      const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '');
      const uniqueFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`;
      
      // Upload Buffer to ImageKit (as base64)
      const response = await imagekit.upload({
        file: file.buffer.toString('base64'),
        fileName: uniqueFileName,
        folder: '/kora_products', // Clean organization
        useUniqueFileName: true
      });
      
      // We push the path rather than the full URL.
      // E.g., "/kora_products/1612...jpg"
      // This allows the frontend to easily append transformation query params later.
      filenames.push(response.filePath); 
    }
    
    req.processedImages = filenames;
    next();
  } catch (err) {
    console.error('Image upload failed via ImageKit:', err);
    next(err);
  }
};

module.exports = { upload, processImages };
