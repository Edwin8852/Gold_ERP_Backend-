const express = require('express');
const router = express.Router();
const documentController = require('./document.controller');
const authMiddleware = require('../../shared/middleware/auth.middleware');
const authorizeRoles = require('../../shared/middleware/role.middleware');
const multer = require('multer');
const path = require('path');

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/documents');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Only JPEG, PNG, and PDF files are allowed!'));
  }
});

router.use(authMiddleware);

/**
 * Customer Routes
 */
router.post('/upload', upload.single('document'), documentController.uploadDocument);
router.get('/my-documents', authorizeRoles('CUSTOMER'), documentController.getMyDocuments);

/**
 * Admin Routes
 */
router.get('/all-documents', authorizeRoles('SUPER_ADMIN', 'ADMIN'), documentController.getAllDocuments);
router.patch('/:id/verify', authorizeRoles('SUPER_ADMIN', 'ADMIN'), documentController.verifyDocument);

module.exports = router;
