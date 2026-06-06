const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sales_bi_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true // This ensures dates are returned as YYYY-MM-DD instead of JavaScript dates
});

// Test the connection
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('MySQL Database Connected Successfully!');
    connection.release();
  } catch (error) {
    console.error('Database connection failed:', error.message);
    console.error('Make sure MySQL is running and the database is created using schema.sql.');
  }
})();

module.exports = pool;
