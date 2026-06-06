import React, { useState, useEffect } from 'react';
import { 
  IndianRupee, 
  TrendingUp, 
  ShoppingCart, 
  Briefcase, 
  Award, 
  Upload, 
  Check, 
  FileWarning,
  Info
} from 'lucide-react';
import API from '../services/api';
import Layout from '../components/Layout';
import KPICard from '../components/KPICard';
import SalesFilter from '../components/SalesFilter';
import Loader from '../components/Loader';
import { formatCurrency } from '../utils/currency';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

const CHART_COLORS = ['#6366F1', '#06B6D4', '#A855F7', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

const Dashboard = () => {
  // State for data
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [clearExisting, setClearExisting] = useState(true);

  // Filters State
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

  // Fetch filters options
  const fetchFilterOptions = async () => {
    try {
      const response = await API.get('/sales/filters');
      setFilterOptions(response.data);
    } catch (err) {
      console.error('Error fetching filters:', err);
    }
  };

  // Fetch Dashboard analytics
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.region) queryParams.append('region', filters.region);

      const response = await API.get(`/sales/dashboard?${queryParams.toString()}`);
      setData(response.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and fetch on filter changes
  useEffect(() => {
    fetchDashboardData();
  }, [filters]);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const handleResetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      category: '',
      region: ''
    });
  };

  // CSV File Upload Handler
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('clearExisting', clearExisting);

    setUploading(true);
    setUploadStatus(null);

    try {
      const response = await API.post('/sales/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setUploadStatus({
        success: true,
        message: `Import Completed! ${response.data.inserted} rows loaded. ${response.data.duplicatesRemoved} duplicates ignored.`
      });
      
      // Refresh options & dashboard data
      fetchFilterOptions();
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      setUploadStatus({
        success: false,
        message: err.response?.data?.message || 'Failed to upload CSV file. Check format.'
      });
    } finally {
      setUploading(false);
    }
  };



  // Render Dashboard Contents
  return (
    <Layout>
      <div className="flex flex-col gap-6">
        
        {/* Title Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Sales Dashboard
            </h2>
            <p className="text-sm text-dark-muted font-medium mt-1">
              Analyze metrics, sales channels, and profits in real-time.
            </p>
          </div>
          
          {/* CSV File Upload Utility */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2 bg-dark-card border border-dark-border px-3.5 py-2 rounded-xl text-xs">
              <input
                type="checkbox"
                id="clearCheck"
                checked={clearExisting}
                onChange={(e) => setClearExisting(e.target.checked)}
                className="w-4 h-4 rounded text-brand-primary bg-dark-deep border-dark-border focus:ring-brand-primary"
              />
              <label htmlFor="clearCheck" className="text-dark-light font-semibold cursor-pointer">
                Clear existing database records
              </label>
            </div>
            
            <label className="cursor-pointer bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-primary hover:to-brand-primary text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-brand-primary/10 hover:shadow-xl hover:shadow-brand-primary/20 transition duration-150 flex items-center justify-center gap-2">
              {uploading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {uploading ? 'Parsing CSV...' : 'Upload Sales CSV'}
              <input
                type="file"
                accept=".csv"
                disabled={uploading}
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Upload Status Alert */}
        {uploadStatus && (
          <div className={`p-4 rounded-xl flex items-start gap-3 border text-sm font-medium ${
            uploadStatus.success 
              ? 'bg-brand-success/10 border-brand-success/20 text-brand-success'
              : 'bg-brand-danger/10 border-brand-danger/20 text-brand-danger'
          }`}>
            {uploadStatus.success ? (
              <Check className="w-5 h-5 flex-shrink-0" />
            ) : (
              <FileWarning className="w-5 h-5 flex-shrink-0" />
            )}
            <div>{uploadStatus.message}</div>
          </div>
        )}

        {/* Filters */}
        <SalesFilter
          filters={filters}
          setFilters={setFilters}
          filterOptions={filterOptions}
          onReset={handleResetFilters}
        />

        {/* Loading and Data Presentation states */}
        {loading ? (
          <Loader type="skeleton" />
        ) : !data || !data.hasData ? (
          /* Empty State Dashboard (First run) */
          <div className="glass-panel border border-dark-border/40 rounded-2xl p-12 text-center flex flex-col items-center max-w-2xl mx-auto my-8">
            <div className="p-5 bg-brand-primary/10 rounded-full text-brand-primary mb-6 shadow-glow-primary">
              <Upload className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Sales Records Found</h3>
            <p className="text-sm text-dark-muted leading-relaxed max-w-md mb-8">
              To begin, upload a Sales CSV file. Your CSV should contain fields like:
              <br />
              <span className="font-semibold text-brand-secondary">Order ID, Order Date, Product Name, Category, Region, Quantity, Sales, Profit</span>.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <label className="cursor-pointer bg-brand-primary hover:bg-brand-primary/95 text-white font-bold text-sm px-6 py-3 rounded-xl transition duration-150 flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Select CSV File
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <a 
                href="/sample_sales.csv" 
                download
                className="text-xs font-semibold text-brand-secondary hover:underline flex items-center gap-1.5"
              >
                <Info className="w-3.5 h-3.5" />
                Download Sample CSV
              </a>
            </div>
          </div>
        ) : (
          /* Dashboard Analytics UI */
          <div className="space-y-6">
            
            {/* KPI Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-5">
              <KPICard
                title="Total Revenue"
                value={formatCurrency(data.kpis.totalSales)}
                icon={IndianRupee}
                color="primary"
                subtext="Accumulated sales volume"
              />
              <KPICard
                title="Total Profit"
                value={formatCurrency(data.kpis.totalProfit)}
                icon={TrendingUp}
                color="success"
                subtext={`Margin: ${((data.kpis.totalProfit / (data.kpis.totalSales || 1)) * 100).toFixed(1)}%`}
              />
              <KPICard
                title="Total Orders"
                value={data.kpis.totalOrders.toLocaleString()}
                icon={ShoppingCart}
                color="secondary"
                subtext="Unique placed invoices"
              />
              <KPICard
                title="Avg Sales / Order"
                value={formatCurrency(data.kpis.avgSales)}
                icon={Briefcase}
                color="warning"
                subtext="Mean transactional value"
              />
              <KPICard
                title="Top Category"
                value={data.kpis.topCategory}
                icon={Award}
                color="purple"
                subtext="Category with max sales"
              />
            </div>

            {/* Charts Row 1: Sales and Profit Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Monthly Sales Trend AreaChart */}
              <div className="glass-panel border border-dark-border/40 rounded-xl p-5 md:p-6">
                <h3 className="text-base font-bold text-white mb-4 tracking-wide">
                  Monthly Sales Trend
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.salesTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#242F48" opacity={0.3} />
                      <XAxis dataKey="month" stroke="#8A99AD" fontSize={11} tickLine={false} />
                      <YAxis stroke="#8A99AD" fontSize={11} tickLine={false} />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="sales" 
                        stroke="#6366F1" 
                        strokeWidth={2.5} 
                        fillOpacity={1} 
                        fill="url(#colorSales)" 
                        name="Revenue" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Monthly Profit Trend LineChart */}
              <div className="glass-panel border border-dark-border/40 rounded-xl p-5 md:p-6">
                <h3 className="text-base font-bold text-white mb-4 tracking-wide">
                  Monthly Profit Trend
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.profitTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#242F48" opacity={0.3} />
                      <XAxis dataKey="month" stroke="#8A99AD" fontSize={11} tickLine={false} />
                      <YAxis stroke="#8A99AD" fontSize={11} tickLine={false} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="profit" 
                        stroke="#10B981" 
                        strokeWidth={2.5} 
                        dot={{ r: 4, strokeWidth: 1.5, fill: '#0B0F19' }} 
                        activeDot={{ r: 6 }}
                        name="Profit"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Charts Row 2: Category Pie, Region Bar, Top Products Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Category Breakdown (Pie) */}
              <div className="glass-panel border border-dark-border/40 rounded-xl p-5 md:p-6">
                <h3 className="text-base font-bold text-white mb-4 tracking-wide">
                  Sales by Category
                </h3>
                <div className="h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.salesByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="sales"
                        nameKey="category"
                      >
                        {data.salesByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend 
                        layout="horizontal" 
                        verticalAlign="bottom" 
                        align="center" 
                        iconSize={10} 
                        iconType="circle"
                        wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Regional Performance (Bar) */}
              <div className="glass-panel border border-dark-border/40 rounded-xl p-5 md:p-6">
                <h3 className="text-base font-bold text-white mb-4 tracking-wide">
                  Sales by Region
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.salesByRegion} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#242F48" opacity={0.2} />
                      <XAxis dataKey="region" stroke="#8A99AD" fontSize={11} tickLine={false} />
                      <YAxis stroke="#8A99AD" fontSize={11} tickLine={false} />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Bar dataKey="sales" fill="#06B6D4" radius={[6, 6, 0, 0]} name="Sales">
                        {data.salesByRegion.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#06B6D4' : '#6366F1'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top 10 Products (Horizontal Bar) */}
              <div className="glass-panel border border-dark-border/40 rounded-xl p-5 md:p-6">
                <h3 className="text-base font-bold text-white mb-4 tracking-wide">
                  Top Products
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={data.topProducts.slice(0, 5)} 
                      layout="vertical"
                      margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#242F48" opacity={0.2} />
                      <XAxis type="number" stroke="#8A99AD" fontSize={10} tickLine={false} hide />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        stroke="#8A99AD" 
                        fontSize={9} 
                        tickLine={false} 
                        width={90}
                        tickFormatter={(val) => val.length > 15 ? `${val.substring(0, 15)}...` : val}
                      />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Bar dataKey="sales" fill="#A855F7" radius={[0, 6, 6, 0]} name="Sales" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
