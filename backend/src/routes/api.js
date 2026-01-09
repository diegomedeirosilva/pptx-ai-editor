const express = require('express');
const router = express.Router();
const upload = require('../middleware/fileUpload');
const pptxController = require('../controllers/pptxController');

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Upload endpoint (Phase 1)
router.post('/upload', upload.single('slide'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    res.json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        path: req.file.path
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
});

// Parse endpoint (Phase 2) - Parse PPTX and return structure
router.post('/parse', upload.single('slide'), pptxController.parseSlide);

// Process endpoint (Phase 3+4) - AI processing and modification
router.post('/process', upload.single('slide'), pptxController.processSlide);

// Download endpoint (Phase 5)
router.get('/download/:filename', pptxController.downloadFile);

// Error handling for multer
router.use((err, req, res, next) => {
  if (err instanceof require('multer').MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
    return res.status(400).json({ error: err.message });
  }

  if (err.message === 'Only .pptx files are allowed') {
    return res.status(400).json({ error: err.message });
  }

  next(err);
});

module.exports = router;
