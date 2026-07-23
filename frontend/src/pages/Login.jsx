import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, AlertCircle, CheckCircle2, Zap, KeyRound, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';

const Login = () => {
  const [email, setEmail] = useState('demo@medibot.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Forgot Password View State
  const [isForgotView, setIsForgotView] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const { login } = useAuth();

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      console.error("Login error:", err);
      const detail = err.response?.data?.detail;
      if (err.response?.status === 401 || detail === "Incorrect email or password") {
        setError("Invalid credentials. Click 'Forgot Password?' below or use Quick Demo Login.");
      } else {
        setError(detail || "Unable to log in. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('demo@medibot.com');
    setPassword('password123');
    setError('');
    setSuccess('');
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

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await api.post('/users/reset-password', {
        email: resetEmail,
        password: newPassword
      });
      setSuccess(res.data.message || "Password updated successfully! You can now log in.");
      setEmail(resetEmail);
      setPassword(newPassword);
      setIsForgotView(false);
    } catch (err) {
      console.error("Reset error:", err);
      setError(err.response?.data?.detail || "Failed to reset password. Please verify your email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 min-h-screen">
      <div className="w-full max-w-md p-8 bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 transition-all">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-teal-100 dark:bg-teal-900/30 rounded-full">
            <Activity className="h-8 w-8 text-teal-600 dark:text-teal-400" />
          </div>
        </div>

        {!isForgotView ? (
          /* MAIN LOGIN VIEW */
          <div>
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

            {success && (
              <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-2xl text-sm flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-500" />
                <div>{success}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email Address</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="demo@medibot.com" className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none transition text-sm" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium">Password</label>
                  <button 
                    type="button" 
                    onClick={() => { setError(''); setSuccess(''); setIsForgotView(true); }}
                    className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                  >
                    <KeyRound className="w-3.5 h-3.5" /> Forgot password?
                  </button>
                </div>
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
        ) : (
          /* FORGOT PASSWORD VIEW */
          <div>
            <button 
              type="button" 
              onClick={() => { setError(''); setIsForgotView(false); }}
              className="text-xs font-bold text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 mb-4 flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </button>
            
            <h2 className="text-2xl font-bold text-center mb-2">Reset Password</h2>
            <p className="text-center text-slate-500 dark:text-slate-400 mb-6 text-sm">Enter your registered email and choose a new password</p>

            {error && (
              <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-2xl text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" />
                <div>{error}</div>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Registered Email</label>
                <input 
                  type="email" 
                  value={resetEmail} 
                  onChange={e=>setResetEmail(e.target.value)} 
                  required 
                  placeholder="yourname@example.com" 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none transition text-sm" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">New Password</label>
                <input 
                  type="password" 
                  value={newPassword} 
                  onChange={e=>setNewPassword(e.target.value)} 
                  required 
                  placeholder="Enter new password" 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none transition text-sm" 
                />
              </div>
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full py-3 px-4 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-md text-sm"
              >
                {loading ? 'Updating Password...' : 'Reset Password & Sign In'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
export default Login;
