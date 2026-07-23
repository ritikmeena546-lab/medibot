import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      console.error("Login error:", err);
      const detail = err.response?.data?.detail;
      if (err.response?.status === 401 || detail === "Incorrect email or password") {
        setError("Invalid email or password. If this is your first time on this live site, please Sign Up first to create your account!");
      } else {
        setError(detail || "Unable to log in. Please check your network connection or try creating a new account via Sign Up.");
      }
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
        <p className="text-center text-slate-500 dark:text-slate-400 mb-8">Enter your medical portal credentials</p>
        
        {error && (
          <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-2xl text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">Email Address</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@example.com" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none transition" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="••••••••" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none transition" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 px-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl transition shadow-md">
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
