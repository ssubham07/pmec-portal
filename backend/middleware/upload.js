const multer = require('multer');
const path = require('path');
const fs = require('fs');

function makeStorage(subfolder) {
  const dir = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads', subfolder);
  fs.mkdirSync(dir, { recursive: true });

  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename: (req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${path.extname(file.originalname)}`);
    },
  });
}

// Supporting documents attached to a request (marksheets, ID proofs, etc.)
const uploadDocument = multer({
  storage: makeStorage('documents'),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /pdf|jpg|jpeg|png/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase());
    cb(ok ? null : new Error('Only PDF/JPG/PNG files are allowed.'), ok);
  },
});

// Admin e-signature image (PNG from a signature pad, or an uploaded scanned signature)
const uploadSignature = multer({
  storage: makeStorage('signatures'),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const ok = /png|jpg|jpeg/.test(path.extname(file.originalname).toLowerCase());
    cb(ok ? null : new Error('Signature must be a PNG or JPG image.'), ok);
  },
});

module.exports = { uploadDocument, uploadSignature };
