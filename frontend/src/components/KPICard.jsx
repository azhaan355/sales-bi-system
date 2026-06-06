import React from 'react';

const KPICard = ({ title, value, icon: Icon, color = 'primary', subtext }) => {
  const colorSchemes = {
    primary: {
      bgGlow: 'shadow-glow-primary',
      iconBg: 'bg-brand-primary/10 text-brand-primary',
      border: 'hover:border-brand-primary/40',
      bar: 'bg-brand-primary'
    },
    secondary: {
      bgGlow: 'shadow-glow-secondary',
      iconBg: 'bg-brand-secondary/10 text-brand-secondary',
      border: 'hover:border-brand-secondary/40',
      bar: 'bg-brand-secondary'
    },
    success: {
      bgGlow: 'shadow-glow-success',
      iconBg: 'bg-brand-success/10 text-brand-success',
      border: 'hover:border-brand-success/40',
      bar: 'bg-brand-success'
    },
    purple: {
      bgGlow: 'shadow-glow-primary', // fallback
      iconBg: 'bg-brand-purple/10 text-brand-purple',
      border: 'hover:border-brand-purple/40',
      bar: 'bg-brand-purple'
    },
    warning: {
      bgGlow: 'shadow-glow-primary', // fallback
      iconBg: 'bg-brand-warning/10 text-brand-warning',
      border: 'hover:border-brand-warning/40',
      bar: 'bg-brand-warning'
    }
  };

  const current = colorSchemes[color] || colorSchemes.primary;

  return (
    <div className={`relative overflow-hidden rounded-xl glass-card p-6 border border-dark-border/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${current.bgGlow} ${current.border}`}>
      {/* Visual Accent bar at the top */}
      <div className={`absolute top-0 left-0 w-full h-[2px] ${current.bar}`} />
      
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold tracking-wider text-dark-muted uppercase">
            {title}
          </p>
          <h3 className="mt-2 text-2xl font-bold text-dark-light tracking-tight">
            {value}
          </h3>
        </div>
        <div className={`p-3 rounded-xl ${current.iconBg}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      
      {subtext && (
        <div className="mt-4 flex items-center text-xs text-dark-muted font-medium">
          <span>{subtext}</span>
        </div>
      )}
    </div>
  );
};

export default KPICard;
