import React from 'react';

const Loader = ({ type = 'spinner', message = 'Loading data...' }) => {
  if (type === 'skeleton') {
    return (
      <div className="w-full space-y-4 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-28 bg-dark-border rounded-xl"></div>
          <div className="h-28 bg-dark-border rounded-xl"></div>
          <div className="h-28 bg-dark-border rounded-xl"></div>
          <div className="h-28 bg-dark-border rounded-xl"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-80 bg-dark-border rounded-xl"></div>
          <div className="h-80 bg-dark-border rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-dark-border border-t-brand-primary animate-spin"></div>
        <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-brand-secondary animate-reverse-spin opacity-70"></div>
      </div>
      <p className="mt-4 text-dark-muted font-medium text-sm animate-pulse tracking-wide uppercase">
        {message}
      </p>
    </div>
  );
};

export default Loader;
