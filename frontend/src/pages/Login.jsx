import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, AlertCircle, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('demo@medibot.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      console.error("Login error:", err);
      const detail = err.response?.data?.detail;
      if (err.response?.status === 401 || detail === "Incorrect email or password") {
        setError("Invalid credentials. Use the 1-Click Demo Login below or Sign Up to create a custom account!");
      } else {
        setError(detail || "Unable to log in. Please check your network connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('demo@medibot.com');
    setPassword('password123');
    setError('');
    setLoading(true);
    try {
      await login('demo@medibot.com', 'password123');
    } catch (err) {
      console.error("Demo login error:", err);
      setError("Demo authentication notice. Click Sign Up to register your account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900">
      <div className="w-full max-w-md p-8 bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-teal-100 dark:bg-teal-900/30 rounded-full">
            <Activity className="h-8 w-8 text-teal-600 dark:text-teal-400" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center mb-2">Welcome Back to MediBot</h2>
        <p className="text-center text-slate-500 dark:text-slate-400 mb-6">Access your AI medical assistant</p>
        
        {/* 1-Click Demo Login Banner */}
        <button 
          type="button"
          onClick={handleDemoLogin}
          disabled={loading}
          className="w-full mb-6 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-2xl transition shadow-md flex items-center justify-center gap-2 active:scale-98"
        >
          <Zap className="w-5 h-5 text-amber-300 fill-amber-300" /> 1-Click Instant Demo Login
        </button>

        <div className="relative flex py-2 items-center mb-6">
          <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
          <span className="flex-shrink mx-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Or sign in with email</span>
          <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-2xl text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email Address</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="demo@medibot.com" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none transition text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="••••••••" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none transition text-sm" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 text-white font-semibold rounded-xl transition shadow-md text-sm">
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
        <p className="text-center mt-6 text-sm text-slate-600 dark:text-slate-400">
          Don't have an account yet? <Link to="/signup" className="text-teal-600 dark:text-teal-400 font-semibold hover:underline">Sign up for free</Link>
        </p>
      </div>
    </div>
  );
};
export default Login;
