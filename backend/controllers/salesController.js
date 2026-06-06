const fs = require('fs');
const axios = require('axios');
const Sales = require('../models/salesModel');
const { parseSalesCSV } = require('../utils/csvParser');
require('dotenv').config();

// @desc    Upload CSV Sales Data
// @route   POST /api/sales/upload
// @access  Private
const uploadSalesCSV = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Please upload a CSV file.' });
  }

  const userId = req.user.id;
  const clearExisting = req.body.clearExisting === 'true';
  const filePath = req.file.path;

  try {
    // Parse and clean CSV
    const parsedData = await parseSalesCSV(filePath);
    let recordsToInsert = parsedData.records;

    // Attach user_id to records
    recordsToInsert = recordsToInsert.map(record => ({
      ...record,
      user_id: userId
    }));

    let deletedCount = 0;
    if (clearExisting) {
      // Clear previous sales for this user
      deletedCount = await Sales.deleteByUserId(userId);
    } else {
      // Smart In-Memory Deduplication against database:
      // Fetch existing sales for the user to compare
      const existingSales = await Sales.getSalesList(userId, {});
      const existingSet = new Set(
        existingSales.map(
          s => `${s.order_id}_${s.order_date}_${s.product_name}_${s.quantity}_${s.sales}_${s.profit}`
        )
      );

      // Filter out records that already exist in database
      recordsToInsert = recordsToInsert.filter(r => {
        const key = `${r.order_id}_${r.order_date}_${r.product_name}_${r.quantity}_${r.sales}_${r.profit}`;
        return !existingSet.has(key);
      });
    }

    let insertedCount = 0;
    if (recordsToInsert.length > 0) {
      insertedCount = await Sales.bulkInsert(recordsToInsert);
    }

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.status(200).json({
      message: 'CSV uploaded and processed successfully.',
      totalParsed: parsedData.records.length,
      inserted: insertedCount,
      duplicatesRemoved: parsedData.duplicateCount + (parsedData.records.length - recordsToInsert.length),
      skippedInvalid: parsedData.skippedCount,
      clearedPrevious: clearExisting,
      deletedCount
    });
  } catch (error) {
    console.error('CSV processing error:', error);
    // Clean up file if error occurs
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.status(500).json({ message: 'Error processing CSV file.', error: error.message });
  }
};

// @desc    Get Dashboard Analytical Data
// @route   GET /api/sales/dashboard
// @access  Private
const getDashboardData = async (req, res) => {
  const userId = req.user.id;
  const { startDate, endDate, category, region } = req.query;
  const filters = { startDate, endDate, category, region };

  try {
    // Check if there is any data
    const allSales = await Sales.getSalesList(userId, {});
    if (allSales.length === 0) {
      return res.status(200).json({
        hasData: false,
        kpis: { totalSales: 0, totalProfit: 0, totalOrders: 0, avgSales: 0, topCategory: 'N/A' },
        salesTrend: [],
        profitTrend: [],
        salesByCategory: [],
        salesByRegion: [],
        topProducts: []
      });
    }

    // Fetch aggregates in parallel
    const [kpis, salesTrend, profitTrend, salesByCategory, salesByRegion, topProducts] = await Promise.all([
      Sales.getKPISummary(userId, filters),
      Sales.getMonthlySalesTrend(userId, filters),
      Sales.getMonthlyProfitTrend(userId, filters),
      Sales.getSalesByCategory(userId, filters),
      Sales.getSalesByRegion(userId, filters),
      Sales.getTopProducts(userId, filters)
    ]);

    res.status(200).json({
      hasData: true,
      kpis,
      salesTrend,
      profitTrend,
      salesByCategory,
      salesByRegion,
      topProducts
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Error fetching analytical data.', error: error.message });
  }
};

// @desc    Get Filter Options (Categories and Regions)
// @route   GET /api/sales/filters
// @access  Private
const getFilterOptions = async (req, res) => {
  const userId = req.user.id;
  try {
    const filters = await Sales.getFilterOptions(userId);
    res.status(200).json(filters);
  } catch (error) {
    console.error('Error fetching filter options:', error);
    res.status(500).json({ message: 'Error fetching filters.', error: error.message });
  }
};

// @desc    Get Filtered Sales List
// @route   GET /api/sales/list
// @access  Private
const getSalesList = async (req, res) => {
  const userId = req.user.id;
  const { startDate, endDate, category, region } = req.query;
  const filters = { startDate, endDate, category, region };

  try {
    const salesList = await Sales.getSalesList(userId, filters);
    res.status(200).json(salesList);
  } catch (error) {
    console.error('Error fetching sales list:', error);
    res.status(500).json({ message: 'Error fetching sales list.', error: error.message });
  }
};

// @desc    Get ML Sales Forecast
// @route   GET /api/sales/forecast
// @access  Private
const getForecast = async (req, res) => {
  const userId = req.user.id;
  try {
    const historical = await Sales.getForecastHistoricalData(userId);
    if (historical.length < 5) {
      return res.status(400).json({
        message: 'Insufficient historical data for forecasting. Please upload more sales data (at least 5 unique dates required).'
      });
    }

    // Call ML Python service
    const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:5000';
    
    try {
      const mlResponse = await axios.post(`${mlServiceUrl}/predict`, { historical }, { timeout: 5000 });
      return res.status(200).json({
        source: 'Python ML Microservice',
        ...mlResponse.data
      });
    } catch (mlError) {
      console.warn('ML Python microservice connection failed. Using Node.js fallback forecasting.', mlError.message);
      
      // FALLBACK: Simple Linear Regression implemented in JS for robustness during viva!
      // Group by month/day or simply regress on date ordinals
      // Let's implement simple linear regression
      const n = historical.length;
      
      // x values as index (0, 1, 2, ...), y values as sales
      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
      for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += historical[i].sales;
        sumXY += i * historical[i].sales;
        sumXX += i * i;
      }
      
      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;
      
      // Forecast next 30 days
      const forecast = [];
      const lastDate = new Date(historical[n - 1].date);
      
      for (let i = 1; i <= 30; i++) {
        const nextDate = new Date(lastDate);
        nextDate.setDate(lastDate.getDate() + i);
        
        // Predict using slope and intercept
        // Index is n + i - 1
        const predictedSales = Math.max(0, slope * (n + i - 1) + intercept);
        
        forecast.push({
          date: nextDate.toISOString().split('T')[0],
          sales: parseFloat(predictedSales.toFixed(2))
        });
      }
      
      res.status(200).json({
        source: 'NodeJS Fallback Engine (ML Microservice Offline)',
        historical: historical,
        forecast: forecast,
        metrics: {
          slope: parseFloat(slope.toFixed(4)),
          intercept: parseFloat(intercept.toFixed(4)),
          message: 'This prediction was generated using the JS Linear Regression fallback because the Python Flask service was offline.'
        }
      });
    }
  } catch (error) {
    console.error('Forecasting route error:', error);
    res.status(500).json({ message: 'Error generating forecast.', error: error.message });
  }
};

module.exports = {
  uploadSalesCSV,
  getDashboardData,
  getFilterOptions,
  getSalesList,
  getForecast
};
