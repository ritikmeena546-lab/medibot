import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Sun, Moon, Activity, LogOut } from 'lucide-react';

const Navbar = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();
  const hideOnPaths = ['/chat'];

  if (hideOnPaths.some(path => location.pathname.startsWith(path))) return null;

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <Activity className="h-8 w-8" />
            <span className="font-bold text-xl tracking-tight">MediBot</span>
          </Link>
          
          <div className="flex items-center gap-6">
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition">
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            {user ? (
              <>
                <Link to="/dashboard" className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 transition">Dashboard</Link>
                <button onClick={logout} className="flex items-center gap-1 text-sm font-medium text-red-500 hover:text-red-600 transition">
                  <LogOut className="h-4 w-4"/> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 transition">Log In</Link>
                <Link to="/signup" className="text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full transition shadow-md hover:shadow-lg">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
