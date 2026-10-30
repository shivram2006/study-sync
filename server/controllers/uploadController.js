const path = require('path');

// @route POST /api/upload
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided' });
    }

    const file = req.file;
    const isImage = file.mimetype.startsWith('image/');
    const fileUrl = `/uploads/${file.filename}`;

    res.status(200).json({
      success: true,
      fileUrl,
      fileName: file.originalname,
      fileSize: file.size,
      fileType: isImage ? 'image' : 'file',
      mimeType: file.mimetype
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: 'File upload failed' });
  }
};
