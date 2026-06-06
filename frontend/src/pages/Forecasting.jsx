import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  BrainCircuit, 
  HelpCircle, 
  AlertTriangle,
  Calendar,
  IndianRupee
} from 'lucide-react';
import API from '../services/api';
import Layout from '../components/Layout';
import Loader from '../components/Loader';
import { formatCurrency } from '../utils/currency';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

const Forecasting = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchForecast = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await API.get('/sales/forecast');
      setData(response.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error occurred generating the forecast. Please verify historical data is loaded.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, []);



  // Combine historical and forecast arrays for Recharts.
  // Historical items will have `sales` key.
  // Forecast items will have `forecastedSales` key.
  // We'll stitch them chronologically.
  const getChartData = () => {
    if (!data) return [];
    
    const chartData = [];
    
    // Add historical sales
    data.historical.forEach(item => {
      chartData.push({
        date: item.date,
        historicalSales: item.sales,
        forecastedSales: null
      });
    });

    // We can duplicate the last historical point as the first forecast point
    // to keep the line continuous on the chart!
    const lastHistory = data.historical[data.historical.length - 1];
    if (lastHistory && data.forecast.length > 0) {
      chartData.push({
        date: lastHistory.date,
        historicalSales: lastHistory.sales,
        forecastedSales: lastHistory.sales
      });
    }

    // Add forecast predictions
    data.forecast.forEach(item => {
      chartData.push({
        date: item.date,
        historicalSales: null,
        forecastedSales: item.sales
      });
    });

    return chartData;
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        
        {/* Header Title */}
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <BrainCircuit className="w-8 h-8 text-brand-primary" />
            Predictive Sales Forecasting
          </h2>
          <p className="text-sm text-dark-muted font-medium mt-1">
            Machine Learning forecasting using Linear Regression (y = mx + c) on historical daily aggregates.
          </p>
        </div>

        {loading ? (
          <Loader message="Running Scikit-Learn Regression Model..." />
        ) : error ? (
          /* Error or Empty State */
          <div className="glass-panel border border-dark-border/40 rounded-2xl p-10 text-center max-w-2xl mx-auto my-8 flex flex-col items-center">
            <div className="p-4 bg-brand-warning/10 rounded-full text-brand-warning mb-6">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Forecasting Unavailable</h3>
            <p className="text-sm text-dark-muted mb-6 max-w-md leading-relaxed">
              {error}
            </p>
            <button
              onClick={fetchForecast}
              className="bg-brand-primary hover:bg-brand-primary/90 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition duration-150"
            >
              Retry Prediction
            </button>
          </div>
        ) : (
          /* Forecast Panel */
          <div className="space-y-6">
            
            {/* Model Equation Card (College Demo Goldmine!) */}
            <div className="glass-panel border border-dark-border/40 rounded-xl p-5 md:p-6 bg-gradient-to-r from-dark-card to-dark-deep/40">
              <h3 className="text-sm font-bold text-brand-secondary tracking-wider uppercase mb-3 flex items-center gap-2">
                <BrainCircuit className="w-4 h-4" />
                Model Fitting Equation & Metrics
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                
                {/* Equation */}
                <div className="md:col-span-2">
                  <p className="text-xs text-dark-muted font-semibold mb-1">Regression Equation</p>
                  <p className="text-lg font-extrabold text-white font-mono tracking-wide">
                    Sales = ({data.metrics?.slope || 0} * TimeIndex) + {data.metrics?.intercept || 0}
                  </p>
                  <p className="text-xs text-dark-muted mt-1.5 leading-relaxed">
                    TimeIndex represents daily offsets from start. A positive slope indicates a growing sales trend.
                  </p>
                </div>

                {/* R2 Score */}
                <div className="bg-dark-deep/60 rounded-xl p-4 border border-dark-border/40">
                  <p className="text-xs text-dark-muted font-semibold">Coefficient of Determination (R²)</p>
                  <h4 className="text-2xl font-black text-brand-primary mt-1">
                    {data.metrics?.r2_score !== undefined ? data.metrics.r2_score : 'Fallback Engine'}
                  </h4>
                  <div className="w-full bg-dark-border h-1.5 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="bg-brand-primary h-full rounded-full" 
                      style={{ width: `${Math.max(0, Math.min(100, (data.metrics?.r2_score || 0.5) * 100))}%` }} 
                    />
                  </div>
                </div>

                {/* Slope / Growth */}
                <div className="bg-dark-deep/60 rounded-xl p-4 border border-dark-border/40">
                  <p className="text-xs text-dark-muted font-semibold">Growth Velocity (Slope)</p>
                  <h4 className={`text-2xl font-black mt-1 ${data.metrics?.slope >= 0 ? 'text-brand-success' : 'text-brand-danger'}`}>
                    {data.metrics?.slope >= 0 ? '+' : ''}{data.metrics?.slope || 0}
                  </h4>
                  <p className="text-[10px] text-dark-muted mt-1">Expected change in daily revenue</p>
                </div>
              </div>

              {data.source && (
                <div className="mt-4 pt-3.5 border-t border-dark-border/40 text-[11px] text-dark-muted flex items-center gap-1.5 font-medium">
                  <span className="inline-block w-2 h-2 rounded-full bg-brand-success animate-pulse" />
                  Calculated by: <span className="font-semibold text-dark-light">{data.source}</span>
                </div>
              )}
            </div>

            {/* Combined Chart */}
            <div className="glass-panel border border-dark-border/40 rounded-xl p-5 md:p-6">
              <h3 className="text-base font-bold text-white mb-4 tracking-wide">
                Historical Sales vs Next 30 Days Forecast
              </h3>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={getChartData()} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorHist" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorFore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#242F48" opacity={0.3} />
                    <XAxis dataKey="date" stroke="#8A99AD" fontSize={11} tickLine={false} />
                    <YAxis stroke="#8A99AD" fontSize={11} tickLine={false} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    
                    {/* Historical Area */}
                    <Area 
                      type="monotone" 
                      dataKey="historicalSales" 
                      fill="url(#colorHist)" 
                      stroke="none" 
                      name="Historical Area"
                      legendType="none"
                    />

                    {/* Historical Line */}
                    <Line 
                      type="monotone" 
                      dataKey="historicalSales" 
                      stroke="#6366F1" 
                      strokeWidth={2.5} 
                      dot={false}
                      name="Historical Actuals" 
                    />

                    {/* Forecasted Line */}
                    <Line 
                      type="monotone" 
                      dataKey="forecastedSales" 
                      stroke="#10B981" 
                      strokeWidth={2.5} 
                      strokeDasharray="6 6"
                      dot={{ r: 3, fill: '#151D30' }}
                      name="Next 30 Days Forecast" 
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Next 30 Days Prediction Table */}
            <div className="glass-panel border border-dark-border/40 rounded-xl p-5 md:p-6">
              <h3 className="text-base font-bold text-white mb-4 tracking-wide flex items-center justify-between">
                <span>Forecast Schedule (Next 30 Days)</span>
                <span className="text-xs text-dark-muted font-normal bg-dark-deep border border-dark-border px-2.5 py-1 rounded-lg">
                  {data.forecast.length} Predictions
                </span>
              </h3>
              
              <div className="overflow-x-auto border border-dark-border/40 rounded-lg max-h-80 overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-dark-card/80 text-dark-muted uppercase text-xs font-bold tracking-wider sticky top-0 border-b border-dark-border/60">
                    <tr>
                      <th className="px-6 py-4 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-brand-primary" />
                        Date
                      </th>
                      <th className="px-6 py-4">Day Offset</th>
                      <th className="px-6 py-4 text-right pr-12 flex items-center justify-end gap-1.5">
                        <IndianRupee className="w-4 h-4 text-brand-success" />
                        Predicted Sales
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-border/30 bg-dark-card/20">
                    {data.forecast.map((item, idx) => (
                      <tr key={idx} className="hover:bg-dark-border/20 transition duration-100">
                        <td className="px-6 py-3.5 font-bold text-dark-light">{item.date}</td>
                        <td className="px-6 py-3.5 text-dark-muted font-medium">Day +{idx + 1}</td>
                        <td className="px-6 py-3.5 text-right pr-12 font-extrabold text-brand-success">
                          {formatCurrency(item.sales)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </div>
    </Layout>
  );
};

export default Forecasting;
