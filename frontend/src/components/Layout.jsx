import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  TrendingUp, 
  FileSpreadsheet, 
  LogOut, 
  Menu, 
  X, 
  User, 
  BarChart3 
} from 'lucide-react';

const Layout = ({ children }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const user = JSON.parse(localStorage.getItem('user')) || { name: 'User' };

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Forecasting', path: '/forecasting', icon: TrendingUp },
    { name: 'Reports & Export', path: '/reports', icon: FileSpreadsheet },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  return (
    <div className="min-h-screen flex bg-dark-deep text-dark-light">
      
      {/* 1. Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-dark-card border-r border-dark-border/50 p-6">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="p-2 bg-gradient-to-tr from-brand-primary to-brand-secondary rounded-lg">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-dark-muted">
              SalesBI System
            </h1>
            <span className="text-xs text-brand-secondary font-semibold uppercase tracking-wider">
              Analytica v1.0
            </span>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 space-y-2">
          {menuItems.map((item, idx) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={idx}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold tracking-wide transition duration-200 group ${
                  isActive 
                    ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/25'
                    : 'text-dark-muted hover:text-dark-light hover:bg-dark-border/30'
                }`}
              >
                <Icon className={`w-5 h-5 transition duration-200 ${isActive ? 'text-white' : 'text-dark-muted group-hover:text-brand-secondary'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold tracking-wide text-brand-danger/80 hover:text-brand-danger hover:bg-brand-danger/5 transition duration-200 border border-transparent hover:border-brand-danger/10"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </aside>

      {/* 2. Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div 
          onClick={toggleMobileSidebar}
          className="fixed inset-0 z-40 bg-black/60 md:hidden backdrop-blur-sm"
        />
      )}

      {/* Mobile Sidebar */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-dark-card border-r border-dark-border/50 p-6 flex flex-col transition-transform duration-300 transform md:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-brand-primary to-brand-secondary rounded-lg">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-base text-white">SalesBI</h1>
          </div>
          <button onClick={toggleMobileSidebar} className="p-1.5 rounded-lg bg-dark-border/40 text-dark-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item, idx) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={idx}
                to={item.path}
                onClick={toggleMobileSidebar}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold tracking-wide transition duration-200 ${
                  isActive 
                    ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/25'
                    : 'text-dark-muted hover:text-dark-light hover:bg-dark-border/30'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold text-brand-danger/85 hover:text-brand-danger transition duration-200"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </aside>

      {/* 3. Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 bg-dark-card border-b border-dark-border/30">
          {/* Menu Hamburger */}
          <button 
            onClick={toggleMobileSidebar} 
            className="p-2 rounded-lg bg-dark-border/40 text-dark-muted hover:text-dark-light md:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Date Widget (Desktop) */}
          <div className="hidden sm:block text-sm text-dark-muted font-medium">
            Project Dashboard &bull; {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>

          {/* User profile dropdown info */}
          <div className="flex items-center gap-3.5 ml-auto">
            <div className="text-right">
              <p className="text-sm font-bold text-dark-light">{user.name}</p>
              <p className="text-xs text-dark-muted">{user.email}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-purple flex items-center justify-center font-bold text-white text-base shadow-lg shadow-brand-primary/10">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
