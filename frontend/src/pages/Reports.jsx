import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  FileDown, 
  Search, 
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import API from '../services/api';
import Layout from '../components/Layout';
import SalesFilter from '../components/SalesFilter';
import Loader from '../components/Loader';
import { formatCurrency } from '../utils/currency';
import { jsPDF } from 'jspdf';

const Reports = () => {
  const [salesList, setSalesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportingPDF, setExportingPDF] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    category: '',
    region: ''
  });

  const [filterOptions, setFilterOptions] = useState({
    categories: [],
    regions: []
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Search input query
  const [searchQuery, setSearchQuery] = useState('');

  const fetchFilters = async () => {
    try {
      const response = await API.get('/sales/filters');
      setFilterOptions(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSales = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.region) queryParams.append('region', filters.region);

      const response = await API.get(`/sales/list?${queryParams.toString()}`);
      setSalesList(response.data);
      setCurrentPage(1); // Reset page on filter
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [filters]);

  useEffect(() => {
    fetchFilters();
  }, []);

  const handleResetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      category: '',
      region: ''
    });
    setSearchQuery('');
  };



  // Filter local data based on keyword search
  const filteredSales = salesList.filter(row => {
    const query = searchQuery.toLowerCase();
    return (
      row.order_id.toLowerCase().includes(query) ||
      row.product_name.toLowerCase().includes(query) ||
      row.category.toLowerCase().includes(query) ||
      row.region.toLowerCase().includes(query)
    );
  });

  // Calculate pagination indices
  const totalItems = filteredSales.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSales.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Client-Side CSV Export (Robust Blob Implementation)
  const exportToCSV = () => {
    if (salesList.length === 0) return;

    const headers = ['Order ID', 'Order Date', 'Product Name', 'Category', 'Region', 'Quantity', 'Sales', 'Profit'];
    const csvContent = [
      headers.join(','),
      ...salesList.map(r => [
        `"${r.order_id}"`,
        r.order_date,
        `"${r.product_name.replace(/"/g, '""')}"`,
        `"${r.category}"`,
        `"${r.region}"`,
        r.quantity,
        r.sales,
        r.profit
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Sales_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Client-Side PDF Summary Generation
  const exportToPDF = () => {
    if (salesList.length === 0) return;
    setExportingPDF(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const centerText = (text, y) => {
        const textWidth = doc.getTextWidth(text);
        doc.text(text, (pageWidth - textWidth) / 2, y);
      };

      // 1. Header Title Block
      doc.setFillColor(21, 29, 48); // Slate navy
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      centerText('SALES BUSINESS INTELLIGENCE SYSTEM', 16);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(6, 182, 212); // Cyan accent
      centerText('EXECUTIVE SUMMARY REPORT', 24);
      
      doc.setTextColor(138, 153, 173); // Muted gray
      centerText(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 32);

      // 2. Filter Scope
      doc.setTextColor(21, 29, 48);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('REPORT FILTER SCOPE:', 15, 52);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      
      let filterY = 60;
      doc.text(`• Date Range: ${filters.startDate || 'Beginning'} to ${filters.endDate || 'Present'}`, 15, filterY);
      doc.text(`• Selected Category: ${filters.category || 'All Categories'}`, 15, filterY + 6);
      doc.text(`• Selected Region: ${filters.region || 'All Regions'}`, 15, filterY + 12);
      doc.text(`• Total Matching Invoices: ${salesList.length}`, 15, filterY + 18);

      // Draw Separator
      doc.setDrawColor(226, 232, 240);
      doc.line(15, filterY + 24, pageWidth - 15, filterY + 24);

      // 3. KPI Calculations
      const totalRevenue = salesList.reduce((acc, curr) => acc + curr.sales, 0);
      const totalProfit = salesList.reduce((acc, curr) => acc + curr.profit, 0);
      const uniqueOrders = new Set(salesList.map(r => r.order_id)).size;
      const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
      const avgOrderVal = uniqueOrders > 0 ? totalRevenue / uniqueOrders : 0;

      doc.setTextColor(21, 29, 48);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('EXECUTIVE METRIC SUMMARY:', 15, 96);

      // KPI Boxes (Grid Layout in PDF)
      const boxWidth = (pageWidth - 30 - 8) / 3;
      const drawKPIBox = (title, val, x, y) => {
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.rect(x, y, boxWidth, 24, 'FD');
        
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(title.toUpperCase(), x + 4, y + 6);
        
        doc.setTextColor(21, 29, 48);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(val, x + 4, y + 16);
      };

      // Helper to format values as Rs. with Indian numbering format
      const formatPDFCurrency = (val) => {
        return formatCurrency(val).replace('₹', 'Rs. ');
      };

      drawKPIBox('Total Sales', formatPDFCurrency(totalRevenue), 15, 104);
      drawKPIBox('Total Profit', formatPDFCurrency(totalProfit), 15 + boxWidth + 4, 104);
      drawKPIBox('Profit Margin', `${profitMargin.toFixed(2)}%`, 15 + (boxWidth * 2) + 8, 104);
      
      drawKPIBox('Unique Invoices', uniqueOrders.toLocaleString(), 15, 134);
      drawKPIBox('Avg Order Value', formatPDFCurrency(avgOrderVal), 15 + boxWidth + 4, 134);
      drawKPIBox('Transaction Count', salesList.length.toLocaleString(), 15 + (boxWidth * 2) + 8, 134);

      // Draw Separator
      doc.setDrawColor(226, 232, 240);
      doc.line(15, 166, pageWidth - 15, 166);

      // 4. Sample Transaction List Table in PDF
      doc.setTextColor(21, 29, 48);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('FIRST 8 TRANSACTIONS IN SCOPE:', 15, 176);

      // Draw table headers
      const tableY = 184;
      doc.setFillColor(21, 29, 48);
      doc.rect(15, tableY, pageWidth - 30, 8, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Date', 17, tableY + 5.5);
      doc.text('Product Name', 40, tableY + 5.5);
      doc.text('Category', 105, tableY + 5.5);
      doc.text('Region', 140, tableY + 5.5);
      doc.text('Sales', 165, tableY + 5.5);
      doc.text('Profit', 183, tableY + 5.5);

      // Draw table rows
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(21, 29, 48);
      
      salesList.slice(0, 8).forEach((item, index) => {
        const rowY = tableY + 8 + (index * 7);
        // Zebra striping
        if (index % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(15, rowY, pageWidth - 30, 7, 'F');
        }
        
        doc.text(item.order_date, 17, rowY + 5);
        
        // Truncate product name
        const prod = item.product_name.length > 30 ? `${item.product_name.substring(0, 30)}...` : item.product_name;
        doc.text(prod, 40, rowY + 5);
        doc.text(item.category, 105, rowY + 5);
        doc.text(item.region, 140, rowY + 5);
        
        doc.setFont('helvetica', 'bold');
        doc.text(formatPDFCurrency(item.sales), 165, rowY + 5);
        doc.text(formatPDFCurrency(item.profit), 183, rowY + 5);
        doc.setFont('helvetica', 'normal');
      });

      // Save PDF
      doc.save(`Sales_Executive_Summary_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error(err);
    } finally {
      setExportingPDF(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        
        {/* Title and Exporters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Reports & Data Export
            </h2>
            <p className="text-sm text-dark-muted font-medium mt-1">
              Filter transaction logs and export high-fidelity CSV/PDF files.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Export CSV */}
            <button
              onClick={exportToCSV}
              disabled={salesList.length === 0}
              className="bg-dark-card hover:bg-dark-border border border-dark-border text-dark-light hover:text-white font-bold text-xs px-4 py-2.5 rounded-xl transition duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileSpreadsheet className="w-4 h-4 text-brand-success" />
              Export Filtered CSV
            </button>

            {/* Export PDF */}
            <button
              onClick={exportToPDF}
              disabled={salesList.length === 0 || exportingPDF}
              className="bg-brand-primary hover:bg-brand-primary/95 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exportingPDF ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <FileDown className="w-4 h-4 text-white" />
              )}
              {exportingPDF ? 'Generating PDF...' : 'Export PDF Summary'}
            </button>
          </div>
        </div>

        {/* Global filter */}
        <SalesFilter
          filters={filters}
          setFilters={setFilters}
          filterOptions={filterOptions}
          onReset={handleResetFilters}
        />

        {/* Table/Data display */}
        {loading ? (
          <Loader message="Loading transaction ledger..." />
        ) : salesList.length === 0 ? (
          <div className="glass-panel border border-dark-border/40 rounded-2xl p-16 text-center flex flex-col items-center max-w-md mx-auto my-8">
            <div className="p-4 bg-dark-border/40 rounded-full text-dark-muted mb-4">
              <FolderOpen className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">No Records Found</h3>
            <p className="text-xs text-dark-muted mb-6">
              There are no matching sales transactions. Adjust filters or upload a fresh CSV file.
            </p>
            <button
              onClick={handleResetFilters}
              className="bg-dark-border/60 hover:bg-dark-border text-dark-light font-bold text-xs px-4 py-2 rounded-lg transition duration-150 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* Search Box and Summary */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative max-w-sm w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-dark-muted" />
                </div>
                <input
                  type="text"
                  placeholder="Search order ID, product name..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1); // Reset page on search
                  }}
                  className="w-full bg-dark-card border border-dark-border/60 text-dark-light placeholder-dark-muted rounded-xl pl-9 pr-4 py-2.5 text-xs focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition duration-150"
                />
              </div>

              <div className="text-xs text-dark-muted font-semibold">
                Showing {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, totalItems)} of {totalItems} entries
              </div>
            </div>

            {/* Datagrid Table */}
            <div className="overflow-x-auto border border-dark-border/40 rounded-xl bg-dark-card/25 backdrop-blur-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-dark-card/85 text-dark-muted uppercase font-bold tracking-wider border-b border-dark-border/60">
                  <tr>
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Order Date</th>
                    <th className="px-6 py-4">Product Name</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Region</th>
                    <th className="px-6 py-4 text-center">Qty</th>
                    <th className="px-6 py-4 text-right">Sales</th>
                    <th className="px-6 py-4 text-right">Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border/30">
                  {currentItems.map((row, idx) => (
                    <tr key={idx} className="hover:bg-dark-border/15 transition duration-100">
                      <td className="px-6 py-3.5 font-bold text-dark-light">{row.order_id}</td>
                      <td className="px-6 py-3.5 text-dark-muted font-medium">{row.order_date}</td>
                      <td className="px-6 py-3.5 text-dark-light font-medium max-w-xs truncate" title={row.product_name}>
                        {row.product_name}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="bg-dark-border/40 text-dark-light border border-dark-border/30 px-2 py-0.5 rounded text-[10px] font-semibold">
                          {row.category}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-dark-muted font-medium">{row.region}</td>
                      <td className="px-6 py-3.5 text-center font-bold text-dark-light">{row.quantity}</td>
                      <td className="px-6 py-3.5 text-right font-extrabold text-white">
                        {formatCurrency(row.sales)}
                      </td>
                      <td className={`px-6 py-3.5 text-right font-extrabold ${row.profit >= 0 ? 'text-brand-success' : 'text-brand-danger'}`}>
                        {formatCurrency(row.profit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="bg-dark-card hover:bg-dark-border border border-dark-border px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: totalPages }).map((_, index) => {
                    const page = index + 1;
                    // Show truncated page numbers if too many
                    if (page === 1 || page === totalPages || Math.abs(currentPage - page) <= 1) {
                      return (
                        <button
                          key={page}
                          onClick={() => paginate(page)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition duration-150 ${
                            currentPage === page
                              ? 'bg-brand-primary text-white'
                              : 'bg-dark-card hover:bg-dark-border border border-dark-border text-dark-muted'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    }
                    if (page === 2 || page === totalPages - 1) {
                      return <span key={page} className="text-dark-muted px-1.5 self-end">...</span>;
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="bg-dark-card hover:bg-dark-border border border-dark-border px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
            
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Reports;
