const path = require('path');

// @route POST /api/upload
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided' });
    }

    const file = req.file;
    const mime = file.mimetype || '';
    const isImage = mime.startsWith('image/');
    const isAudio = mime.startsWith('audio/');
    const isVideo = mime.startsWith('video/');

    let fileType = 'file';
    if (isImage) fileType = 'image';
    else if (isAudio) fileType = 'audio';
    else if (isVideo) fileType = 'video';

    const fileUrl = `/uploads/${file.filename}`;

    res.status(200).json({
      success: true,
      fileUrl,
      fileName: file.originalname,
      fileSize: file.size,
      fileType,
      mimeType: file.mimetype
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: 'File upload failed' });
  }
};
