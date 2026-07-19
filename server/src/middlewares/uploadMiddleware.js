const multer = require('multer');
const path = require('path');
const fs = require('fs');

// uploads live in server/uploads/ (sibling of src/) — simple local disk storage,
// no need for cloud storage (S3 etc.) for a graduation project.
const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
    },
});

const imageFileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const isValidExt = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const isValidMime = allowedTypes.test(file.mimetype);

    if (isValidExt && isValidMime) return cb(null, true);
    cb(new Error('only image files are allowed (jpeg, jpg, png, webp)'));
};

const upload = multer({
    storage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB, matches the message in errorMiddleware.js
});

module.exports = upload;