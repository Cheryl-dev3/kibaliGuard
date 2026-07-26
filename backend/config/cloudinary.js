const multer = require('multer');

// KibaliGuard stores documents as base64 strings directly in MongoDB
// instead of using Cloudinary, so this just exports a memory storage
// multer instance that uploadRoutes.js converts to base64.
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } });

module.exports = upload;
