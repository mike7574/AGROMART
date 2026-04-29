const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const router = express.Router();

const uploadsRoot = path.join(__dirname, '..', 'uploads');
const productUploadsDir = path.join(uploadsRoot, 'products');

if (!fs.existsSync(productUploadsDir)) {
  fs.mkdirSync(productUploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, productUploadsDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeExt = ext || '.jpg';
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `product-${unique}${safeExt}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 8 },
  fileFilter(req, file, cb) {
    if ((file.mimetype || '').startsWith('image/')) {
      cb(null, true);
      return;
    }
    cb(new Error('Only image files are allowed'));
  }
});

router.post('/products', upload.array('images', 8), (req, res) => {
  const host = `${req.protocol}://${req.get('host')}`;
  const files = Array.isArray(req.files) ? req.files : [];
  const urls = files.map((f) => `${host}/uploads/products/${f.filename}`);

  res.json({
    success: true,
    data: {
      urls
    }
  });
});

module.exports = router;
