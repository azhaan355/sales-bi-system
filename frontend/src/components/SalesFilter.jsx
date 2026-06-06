import React from 'react';
import { Calendar, Filter, RotateCcw } from 'lucide-react';

const SalesFilter = ({ 
  filters, 
  setFilters, 
  filterOptions, 
  onReset 
}) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="glass-panel border border-dark-border/40 rounded-xl p-4 md:p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-brand-primary" />
        <h3 className="font-semibold text-dark-light text-base">Filter Parameters</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
        {/* Start Date */}
        <div>
          <label className="block text-xs font-semibold text-dark-muted uppercase mb-1.5 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-brand-secondary" />
            Start Date
          </label>
          <input
            type="date"
            name="startDate"
            value={filters.startDate}
            onChange={handleChange}
            className="w-full bg-dark-deep border border-dark-border/60 text-dark-light rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-primary transition duration-150"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-xs font-semibold text-dark-muted uppercase mb-1.5 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-brand-secondary" />
            End Date
          </label>
          <input
            type="date"
            name="endDate"
            value={filters.endDate}
            onChange={handleChange}
            className="w-full bg-dark-deep border border-dark-border/60 text-dark-light rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-primary transition duration-150"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-semibold text-dark-muted uppercase mb-1.5">
            Category
          </label>
          <select
            name="category"
            value={filters.category}
            onChange={handleChange}
            className="w-full bg-dark-deep border border-dark-border/60 text-dark-light rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-primary transition duration-150"
          >
            <option value="">All Categories</option>
            {filterOptions.categories.map((cat, idx) => (
              <option key={idx} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Region */}
        <div className="flex gap-2 items-center">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-dark-muted uppercase mb-1.5">
              Region
            </label>
            <select
              name="region"
              value={filters.region}
              onChange={handleChange}
              className="w-full bg-dark-deep border border-dark-border/60 text-dark-light rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-primary transition duration-150"
            >
              <option value="">All Regions</option>
              {filterOptions.regions.map((reg, idx) => (
                <option key={idx} value={reg}>{reg}</option>
              ))}
            </select>
          </div>
          
          {/* Reset Button */}
          <button
            onClick={onReset}
            title="Reset Filters"
            className="bg-dark-border/40 hover:bg-dark-border/70 border border-dark-border text-dark-muted hover:text-dark-light p-2.5 rounded-lg transition duration-150 flex items-center justify-center mt-auto"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalesFilter;
