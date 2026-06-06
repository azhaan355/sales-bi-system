const fs = require('fs');
const csv = require('csv-parser');

// Helper to parse dates into YYYY-MM-DD
const parseDate = (dateStr) => {
  if (!dateStr) return null;
  
  dateStr = dateStr.trim();
  
  // Try standard Date parsing
  let d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }

  // Handle DD-MM-YYYY or DD/MM/YYYY or MM/DD/YYYY manually
  const parts = dateStr.split(/[-/]/);
  if (parts.length === 3) {
    let day, month, year;
    
    // Check if the year is the first or third part
    if (parts[2].length === 4) {
      // Format is likely DD/MM/YYYY or MM/DD/YYYY. Let's assume MM/DD/YYYY if parts[0] <= 12 and parts[1] > 12
      // Or general standard DD/MM/YYYY. Let's write a standard fallback.
      const part0 = parseInt(parts[0], 10);
      const part1 = parseInt(parts[1], 10);
      const part2 = parseInt(parts[2], 10);

      if (part0 > 12) {
        // DD/MM/YYYY
        day = part0;
        month = part1;
        year = part2;
      } else {
        // Assume MM/DD/YYYY or check if MM/DD/YYYY is standard.
        // We will do DD/MM/YYYY by default, but fallback to MM/DD/YYYY
        day = part1;
        month = part0;
        year = part2;
      }
    } else if (parts[0].length === 4) {
      // YYYY/MM/DD
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    }

    if (day && month && year) {
      const formattedMonth = String(month).padStart(2, '0');
      const formattedDay = String(day).padStart(2, '0');
      return `${year}-${formattedMonth}-${formattedDay}`;
    }
  }

  return null;
};

// Normalize keys to match database fields
const normalizeKeys = (row) => {
  const normalized = {};
  for (let key in row) {
    const normKey = key.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    normalized[normKey] = row[key];
  }
  return normalized;
};

const parseSalesCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const seen = new Set();
    let skippedCount = 0;
    let duplicateCount = 0;

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        const row = normalizeKeys(data);

        // Map fields and handle missing values
        const orderId = row.order_id || row.orderid;
        const orderDateStr = row.order_date || row.orderdate || row.date;
        const productName = row.product_name || row.product || row.item || 'Unknown Product';
        const category = row.category || 'Unknown';
        const region = row.region || 'Unknown';
        
        let quantity = parseInt(row.quantity);
        let sales = parseFloat(row.sales);
        let profit = parseFloat(row.profit);

        // Data cleaning: handle invalid/missing numeric fields
        if (isNaN(quantity)) quantity = 1;
        if (isNaN(sales)) sales = 0.0;
        if (isNaN(profit)) profit = 0.0;

        const orderDate = parseDate(orderDateStr);

        // Skip records with missing critical fields (Order ID or Order Date)
        if (!orderId || !orderDate) {
          skippedCount++;
          return;
        }

        // Deduplication within the uploaded CSV
        // Create unique key for the row
        const rowKey = `${orderId.trim()}_${orderDate}_${productName.trim()}_${quantity}_${sales}_${profit}`;
        if (seen.has(rowKey)) {
          duplicateCount++;
          return; // Skip duplicate row inside the same CSV
        }
        seen.add(rowKey);

        results.push({
          order_id: orderId.trim(),
          order_date: orderDate,
          product_name: productName.trim(),
          category: category.trim(),
          region: region.trim(),
          quantity,
          sales,
          profit
        });
      })
      .on('end', () => {
        console.log(`CSV Parsing complete: Loaded ${results.length} records. Skipped ${skippedCount} invalid rows. Removed ${duplicateCount} internal duplicates.`);
        resolve({
          records: results,
          skippedCount,
          duplicateCount
        });
      })
      .on('error', (err) => {
        reject(err);
      });
  });
};

module.exports = {
  parseSalesCSV
};
