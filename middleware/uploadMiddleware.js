const multer = require('multer');
const path = require('path');
const sharp = require('sharp');

// Configure storage
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    files: 10 // Max 10 files
  },
  fileFilter: fileFilter
});

// Image processing middleware
const processImages = async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next();
  }

  try {
    const processedImages = [];
    
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      
      // Generate unique filename
      const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${i}.webp`;
      const filepath = path.join(process.env.UPLOAD_PATH || 'public/uploads', filename);
      
      // Process image with Sharp
      await sharp(file.buffer)
        .resize(1200, 800, { 
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality: 85 })
        .toFile(filepath);
      
      // Create thumbnail
      const thumbnailPath = path.join(process.env.UPLOAD_PATH || 'public/uploads', `thumb-${filename}`);
      await sharp(file.buffer)
        .resize(300, 200, { 
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality: 80 })
        .toFile(thumbnailPath);
      
      processedImages.push({
        url: `/uploads/${filename}`,
        thumbnail: `/uploads/thumb-${filename}`,
        originalName: file.originalname,
        size: file.size,
        isPrimary: i === 0 // First image is primary
      });
    }
    
    req.processedImages = processedImages;
    next();
  } catch (error) {
    next(error);
  }
};

// Single image upload
const uploadSingle = upload.single('image');

// Multiple images upload
const uploadMultiple = upload.array('images', 10);

// Avatar upload
const uploadAvatar = upload.single('avatar');

module.exports = {
  uploadSingle,
  uploadMultiple,
  uploadAvatar,
  processImages
};
