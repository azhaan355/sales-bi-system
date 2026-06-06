-- MySQL Database Schema for Business Intelligence System
CREATE DATABASE IF NOT EXISTS sales_bi_db;
USE sales_bi_db;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Sales Table
CREATE TABLE IF NOT EXISTS sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  order_id VARCHAR(255) NOT NULL,
  order_date DATE NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  category VARCHAR(255) NOT NULL,
  region VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  sales DECIMAL(12,2) NOT NULL,
  profit DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_sales (user_id),
  INDEX idx_order_date (order_date),
  INDEX idx_category (category),
  INDEX idx_region (region)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
