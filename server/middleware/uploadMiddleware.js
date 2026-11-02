const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Map common mimetypes to file extensions when filename is a generic blob
const MIME_EXTENSION_MAP = {
  'audio/webm': '.webm',
  'audio/ogg': '.ogg',
  'audio/mp4': '.m4a',
  'audio/mpeg': '.mp3',
  'audio/wav': '.wav',
  'video/webm': '.webm',
  'video/mp4': '.mp4',
  'video/quicktime': '.mov',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif'
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    let ext = path.extname(file.originalname).toLowerCase();
    
    // If no extension or generic blob name, extract from mimetype
    if (!ext || ext === '' || ext === '.blob') {
      const mimeBase = (file.mimetype || '').split(';')[0].toLowerCase();
      ext = MIME_EXTENSION_MAP[mimeBase] || (file.mimetype.startsWith('audio/') ? '.webm' : file.mimetype.startsWith('video/') ? '.webm' : '.dat');
    }

    const cleanBaseName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .slice(0, 40) || 'media';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${cleanBaseName}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|webp|gif|svg|pdf|doc|docx|txt|zip|mp3|wav|ogg|m4a|webm|mp4|mov|3gp|aac|flac/;
  let ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  
  if (allowedExtensions.test(ext)) {
    return cb(null, true);
  }

  // Also accept if mimetype starts with image/, audio/, or video/
  const mime = file.mimetype || '';
  if (
    mime.startsWith('image/') ||
    mime.startsWith('audio/') ||
    mime.startsWith('video/') ||
    mime === 'application/pdf'
  ) {
    return cb(null, true);
  }

  cb(new Error('Unsupported file format. Please upload an image, audio, video, or document.'));
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50 MB limit
  },
  fileFilter: fileFilter
});

module.exports = upload;
