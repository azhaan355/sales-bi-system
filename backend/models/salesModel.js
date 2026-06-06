const db = require('../config/db');

const Sales = {
  // Bulk insert sales records
  bulkInsert: async (records) => {
    if (records.length === 0) return 0;
    
    const query = `
      INSERT INTO sales (
        user_id, order_id, order_date, product_name, category, region, quantity, sales, profit
      ) VALUES ?
    `;

    const values = records.map(r => [
      r.user_id,
      r.order_id,
      r.order_date,
      r.product_name,
      r.category,
      r.region,
      r.quantity,
      r.sales,
      r.profit
    ]);

    const [result] = await db.query(query, [values]);
    return result.affectedRows;
  },

  // Delete all sales records for a user
  deleteByUserId: async (userId) => {
    const [result] = await db.query('DELETE FROM sales WHERE user_id = ?', [userId]);
    return result.affectedRows;
  },

  // Check if a duplicate record already exists in database
  checkDuplicate: async (userId, orderId, productName, orderDate, quantity, sales, profit) => {
    const [rows] = await db.query(
      `SELECT id FROM sales 
       WHERE user_id = ? AND order_id = ? AND product_name = ? AND order_date = ? 
         AND quantity = ? AND sales = ? AND profit = ? LIMIT 1`,
      [userId, orderId, productName, orderDate, quantity, sales, profit]
    );
    return rows.length > 0;
  },

  // Build dynamic WHERE clause based on filters
  buildFilterQuery: (userId, filters) => {
    let whereClause = 'WHERE user_id = ?';
    const params = [userId];

    if (filters.startDate) {
      whereClause += ' AND order_date >= ?';
      params.push(filters.startDate);
    }
    if (filters.endDate) {
      whereClause += ' AND order_date <= ?';
      params.push(filters.endDate);
    }
    if (filters.category) {
      whereClause += ' AND category = ?';
      params.push(filters.category);
    }
    if (filters.region) {
      whereClause += ' AND region = ?';
      params.push(filters.region);
    }

    return { whereClause, params };
  },

  // Get KPI Summary (Total Sales, Total Profit, Total Orders, Average Sales, Top Category)
  getKPISummary: async (userId, filters) => {
    const { whereClause, params } = Sales.buildFilterQuery(userId, filters);

    // Get primary KPIs
    const kpiQuery = `
      SELECT 
        COALESCE(SUM(sales), 0) as totalSales,
        COALESCE(SUM(profit), 0) as totalProfit,
        COUNT(DISTINCT order_id) as totalOrders,
        COALESCE(AVG(sales), 0) as avgSales
      FROM sales
      ${whereClause}
    `;
    const [kpiRows] = await db.query(kpiQuery, params);
    const primaryKPIs = kpiRows[0];

    // Get Top Category
    const categoryQuery = `
      SELECT category, SUM(sales) as categorySales
      FROM sales
      ${whereClause}
      GROUP BY category
      ORDER BY categorySales DESC
      LIMIT 1
    `;
    const [categoryRows] = await db.query(categoryQuery, params);
    const topCategory = categoryRows[0] ? categoryRows[0].category : 'N/A';

    return {
      totalSales: parseFloat(primaryKPIs.totalSales),
      totalProfit: parseFloat(primaryKPIs.totalProfit),
      totalOrders: parseInt(primaryKPIs.totalOrders),
      avgSales: parseFloat(primaryKPIs.avgSales),
      topCategory
    };
  },

  // Get Monthly Sales Trend (Line/Area Chart)
  getMonthlySalesTrend: async (userId, filters) => {
    const { whereClause, params } = Sales.buildFilterQuery(userId, filters);
    const query = `
      SELECT 
        DATE_FORMAT(order_date, '%Y-%m') as month,
        SUM(sales) as sales
      FROM sales
      ${whereClause}
      GROUP BY month
      ORDER BY month ASC
    `;
    const [rows] = await db.query(query, params);
    return rows.map(r => ({ month: r.month, sales: parseFloat(r.sales) }));
  },

  // Get Monthly Profit Trend (Line Chart)
  getMonthlyProfitTrend: async (userId, filters) => {
    const { whereClause, params } = Sales.buildFilterQuery(userId, filters);
    const query = `
      SELECT 
        DATE_FORMAT(order_date, '%Y-%m') as month,
        SUM(profit) as profit
      FROM sales
      ${whereClause}
      GROUP BY month
      ORDER BY month ASC
    `;
    const [rows] = await db.query(query, params);
    return rows.map(r => ({ month: r.month, profit: parseFloat(r.profit) }));
  },

  // Get Sales by Category (Pie Chart)
  getSalesByCategory: async (userId, filters) => {
    const { whereClause, params } = Sales.buildFilterQuery(userId, filters);
    const query = `
      SELECT 
        category,
        SUM(sales) as sales
      FROM sales
      ${whereClause}
      GROUP BY category
      ORDER BY sales DESC
    `;
    const [rows] = await db.query(query, params);
    return rows.map(r => ({ category: r.category, sales: parseFloat(r.sales) }));
  },

  // Get Sales by Region (Bar Chart)
  getSalesByRegion: async (userId, filters) => {
    const { whereClause, params } = Sales.buildFilterQuery(userId, filters);
    const query = `
      SELECT 
        region,
        SUM(sales) as sales
      FROM sales
      ${whereClause}
      GROUP BY region
      ORDER BY sales DESC
    `;
    const [rows] = await db.query(query, params);
    return rows.map(r => ({ region: r.region, sales: parseFloat(r.sales) }));
  },

  // Get Top 10 Products (Bar Chart)
  getTopProducts: async (userId, filters) => {
    const { whereClause, params } = Sales.buildFilterQuery(userId, filters);
    const query = `
      SELECT 
        product_name as name,
        SUM(sales) as sales
      FROM sales
      ${whereClause}
      GROUP BY product_name
      ORDER BY sales DESC
      LIMIT 10
    `;
    const [rows] = await db.query(query, params);
    return rows.map(r => ({ name: r.name, sales: parseFloat(r.sales) }));
  },

  // Get Filtered Sales List (for Reports Table and CSV Export)
  getSalesList: async (userId, filters) => {
    const { whereClause, params } = Sales.buildFilterQuery(userId, filters);
    const query = `
      SELECT 
        order_id,
        order_date,
        product_name,
        category,
        region,
        quantity,
        sales,
        profit
      FROM sales
      ${whereClause}
      ORDER BY order_date DESC
    `;
    const [rows] = await db.query(query, params);
    return rows.map(r => ({
      order_id: r.order_id,
      order_date: r.order_date,
      product_name: r.product_name,
      category: r.category,
      region: r.region,
      quantity: parseInt(r.quantity),
      sales: parseFloat(r.sales),
      profit: parseFloat(r.profit)
    }));
  },

  // Get Filter Options (to populate dropdown UI filters dynamically)
  getFilterOptions: async (userId) => {
    const [categories] = await db.query(
      'SELECT DISTINCT category FROM sales WHERE user_id = ? ORDER BY category',
      [userId]
    );
    const [regions] = await db.query(
      'SELECT DISTINCT region FROM sales WHERE user_id = ? ORDER BY region',
      [userId]
    );
    return {
      categories: categories.map(c => c.category),
      regions: regions.map(r => r.region)
    };
  },

  // Get Historical Daily/Monthly Sales for Forecasting (ordered chronologically)
  getForecastHistoricalData: async (userId) => {
    const query = `
      SELECT 
        order_date,
        SUM(sales) as sales
      FROM sales
      WHERE user_id = ?
      GROUP BY order_date
      ORDER BY order_date ASC
    `;
    const [rows] = await db.query(query, [userId]);
    return rows.map(r => ({
      date: r.order_date,
      sales: parseFloat(r.sales)
    }));
  }
};

module.exports = Sales;
