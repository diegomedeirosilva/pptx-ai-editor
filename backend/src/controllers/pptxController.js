const pptxParser = require('../services/pptxParser');
const aiService = require('../services/aiService');
const pptxModifier = require('../services/pptxModifier');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

class PPTXController {
  // Parse uploaded PPTX and return structure
  async parseSlide(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const slideData = await pptxParser.parse(req.file.path);

      res.json({
        success: true,
        message: 'File parsed successfully',
        file: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size
        },
        data: slideData
      });

    } catch (error) {
      console.error('Error parsing slide:', error);
      res.status(500).json({
        error: 'Failed to parse slide',
        details: error.message
      });
    }
  }

  // Process slide with AI instructions (Phase 3+4)
  async processSlide(req, res) {
    try {
      const { instructions } = req.body;
      const uploadedFile = req.file;

      if (!uploadedFile) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      if (!instructions || instructions.trim() === '') {
        return res.status(400).json({ error: 'No instructions provided' });
      }

      // Parse the PPTX
      const slideData = await pptxParser.parse(uploadedFile.path);

      // Get AI interpretation of instructions
      const aiResponse = await aiService.interpretInstructions(slideData, instructions);
      const operations = aiResponse.operations || [];

      let downloadUrl = null;
      let modifiedFile = null;

      // Apply modifications if there are operations
      if (operations.length > 0) {
        modifiedFile = await pptxModifier.modify(uploadedFile.path, operations);
        downloadUrl = `/api/download/${modifiedFile.filename}`;
      }

      // Clean up uploaded file
      try {
        await fs.unlink(uploadedFile.path);
      } catch (cleanupError) {
        console.error('Failed to cleanup uploaded file:', cleanupError);
      }

      res.json({
        success: true,
        message: operations.length > 0 ? 'Slide modified successfully' : 'No modifications to apply',
        instructions: instructions,
        slideData: slideData,
        aiResponse: aiResponse,
        operations: operations,
        explanation: aiResponse.explanation || '',
        downloadUrl: downloadUrl
      });

    } catch (error) {
      console.error('Error processing slide:', error);
      res.status(500).json({
        error: 'Failed to process slide',
        details: error.message
      });
    }
  }

  // Download modified file (Phase 5)
  async downloadFile(req, res) {
    try {
      const { filename } = req.params;

      // Security check
      if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return res.status(400).json({ error: 'Invalid filename' });
      }

      const filePath = path.join(process.env.OUTPUT_DIR || './output', filename);

      // Check if file exists
      await fs.access(filePath);

      res.download(filePath, 'modified-slide.pptx', async (err) => {
        if (err) {
          console.error('Download error:', err);
        } else {
          // Cleanup file after download
          try {
            await fs.unlink(filePath);
          } catch (cleanupError) {
            console.error('Cleanup error:', cleanupError);
          }
        }
      });

    } catch (error) {
      res.status(404).json({ error: 'File not found' });
    }
  }
}

module.exports = new PPTXController();
