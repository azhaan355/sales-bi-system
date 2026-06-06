const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/authMiddleware');
const {
  uploadSalesCSV,
  getDashboardData,
  getFilterOptions,
  getSalesList,
  getForecast
} = require('../controllers/salesController');

const router = express.Router();

// Configure Multer for CSV Uploads
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed!'), false);
  }
};

const upload = multer({ storage, fileFilter });

// Routes (all protected with JWT)
router.post('/upload', protect, upload.single('file'), uploadSalesCSV);
router.get('/dashboard', protect, getDashboardData);
router.get('/filters', protect, getFilterOptions);
router.get('/list', protect, getSalesList);
router.get('/forecast', protect, getForecast);

module.exports = router;
