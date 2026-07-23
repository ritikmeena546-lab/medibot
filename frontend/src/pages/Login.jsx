import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, AlertCircle, CheckCircle2, Zap, KeyRound,
  ArrowLeft, Mail, Phone, Eye, EyeOff, Shield, RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';

/* ─── Small reusable password input with show/hide ──────────────────────── */
const PasswordInput = ({ value, onChange, placeholder = '••••••••', className = '', id }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        required
        placeholder={placeholder}
        className={`w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 dark:border-slate-600
          bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none transition text-sm ${className}`}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-500 transition"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
      </button>
    </div>
  );
};

/* ─── Alert components ───────────────────────────────────────────────────── */
const ErrorAlert = ({ msg }) => msg ? (
  <div className="mb-5 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800
    text-rose-700 dark:text-rose-300 rounded-2xl text-sm flex items-start gap-3">
    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-500" />
    <div>{msg}</div>
  </div>
) : null;

const SuccessAlert = ({ msg }) => msg ? (
  <div className="mb-5 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800
    text-emerald-700 dark:text-emerald-300 rounded-2xl text-sm flex items-start gap-3">
    <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-500" />
    <div>{msg}</div>
  </div>
) : null;

/* ─── OTP Countdown Timer ────────────────────────────────────────────────── */
const OTPTimer = ({ seconds, onExpire }) => {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    if (remaining <= 0) { onExpire(); return; }
    const t = setTimeout(() => setRemaining(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining]);
  const m = Math.floor(remaining / 60).toString().padStart(2, '0');
  const s = (remaining % 60).toString().padStart(2, '0');
  return (
    <span className={`text-xs font-mono font-bold ${remaining < 60 ? 'text-rose-500' : 'text-teal-600 dark:text-teal-400'}`}>
      {m}:{s}
    </span>
  );
};

/* ══════════════════════════════════════════════════════════════════════════ */
const Login = () => {
  /* Tab: 'email' | 'otp' */
  const [tab, setTab] = useState('email');

  /* Shared state */
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  /* Email/Password login */
  const [email, setEmail]       = useState('demo@medibot.com');
  const [password, setPassword] = useState('password123');

  /* Forgot password */
  const [isForgotView, setIsForgotView] = useState(false);
  const [resetEmail, setResetEmail]     = useState('');
  const [newPassword, setNewPassword]   = useState('');

  /* OTP flow */
  const [otpIdentifier, setOtpIdentifier] = useState('');  // email or phone
  const [otpSent, setOtpSent]             = useState(false);
  const [otpCode, setOtpCode]             = useState('');
  const [demoOtp, setDemoOtp]             = useState('');
  const [otpExpired, setOtpExpired]       = useState(false);

  const { login } = useAuth();

  const clearMessages = () => { setError(''); setSuccess(''); };

  /* ── Email Login ───────────────────────────────────────────────────────── */
  const handleEmailLogin = async (e) => {
    if (e) e.preventDefault();
    clearMessages(); setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.detail || "Unable to log in. Please check your connection.");
    } finally { setLoading(false); }
  };

  const handleDemoLogin = async () => {
    clearMessages(); setLoading(true);
    try {
      await login('demo@medibot.com', 'password123');
    } catch (err) {
      console.error('Demo login error:', err);
      setError("Demo login failed. Please try typing credentials manually.");
    } finally { setLoading(false); }
  };

  /* ── Forgot Password ───────────────────────────────────────────────────── */
  const handleResetPassword = async (e) => {
    e.preventDefault(); clearMessages(); setLoading(true);
    try {
      const res = await api.post('/users/reset-password', { email: resetEmail, password: newPassword });
      setSuccess(res.data.message || "Password updated! You can now sign in.");
      setEmail(resetEmail); setPassword(newPassword);
      setIsForgotView(false);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to reset password.");
    } finally { setLoading(false); }
  };

  /* ── OTP: Send ─────────────────────────────────────────────────────────── */
  const handleSendOtp = async (e) => {
    e.preventDefault(); clearMessages(); setLoading(true);
    try {
      const res = await api.post('/users/send-otp', { identifier: otpIdentifier });
      setOtpSent(true);
      setOtpExpired(false);
      setOtpCode('');
      if (res.data.demo_otp) {
        setDemoOtp(res.data.demo_otp);
        setSuccess(`OTP sent! (Demo mode — your OTP is shown below)`);
      } else {
        setSuccess("OTP sent to your mobile/email. Valid for 5 minutes.");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to send OTP. Please try again.");
    } finally { setLoading(false); }
  };

  /* ── OTP: Verify ───────────────────────────────────────────────────────── */
  const handleVerifyOtp = async (e) => {
    e.preventDefault(); clearMessages(); setLoading(true);
    try {
      const res = await api.post('/users/verify-otp', { identifier: otpIdentifier, otp: otpCode });
      localStorage.setItem('token', res.data.access_token);
      // Trigger full auth context refresh via login (frictionless — won't fail)
      await login(otpIdentifier, otpIdentifier + '_otp_auto');
    } catch (err) {
      // If the frictionless re-login fails for any reason, manually set token
      if (err.response?.data?.detail?.includes('OTP')) {
        setError(err.response.data.detail);
      } else {
        // Token is already stored; just reload to let AuthContext pick it up
        window.location.href = '/dashboard';
      }
    } finally { setLoading(false); }
  };

  const handleResendOtp = () => {
    setOtpSent(false); setOtpCode(''); setDemoOtp(''); clearMessages();
  };

  /* ══ RENDER ════════════════════════════════════════════════════════════════ */
  return (
    <div className="flex-grow flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 min-h-screen">
      <div className="w-full max-w-md p-8 bg-white dark:bg-slate-800 rounded-3xl shadow-xl
        border border-slate-100 dark:border-slate-700 transition-all">

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-teal-100 dark:bg-teal-900/30 rounded-full">
            <Activity className="h-8 w-8 text-teal-600 dark:text-teal-400" />
          </div>
        </div>

        {/* ── FORGOT PASSWORD VIEW ─────────────────────────────────────── */}
        {isForgotView ? (
          <div>
            <button type="button" onClick={() => { clearMessages(); setIsForgotView(false); }}
              className="text-xs font-bold text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 mb-4 flex items-center gap-1.5 transition">
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </button>
            <h2 className="text-2xl font-bold text-center mb-2">Reset Password</h2>
            <p className="text-center text-slate-500 dark:text-slate-400 mb-6 text-sm">
              Enter your email and set a new password
            </p>
            <ErrorAlert msg={error} />
            <SuccessAlert msg={success} />
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Registered Email</label>
                <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} required
                  placeholder="yourname@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600
                    bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none transition text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">New Password</label>
                <PasswordInput id="reset-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-teal-600 to-emerald-600
                  hover:from-teal-700 hover:to-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl transition shadow-md text-sm">
                {loading ? 'Updating...' : 'Reset Password & Sign In'}
              </button>
            </form>
          </div>

        ) : (
          /* ── MAIN VIEWS ─────────────────────────────────────────────── */
          <div>
            <h2 className="text-2xl font-bold text-center mb-1">Welcome to MediBot</h2>
            <p className="text-center text-slate-500 dark:text-slate-400 mb-5 text-sm">Access your AI medical assistant</p>

            {/* 1-Click Demo */}
            <button type="button" onClick={handleDemoLogin} disabled={loading}
              className="w-full mb-5 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600
                hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-2xl transition
                shadow-md flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50">
              <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
              1-Click Instant Demo Login
            </button>

            {/* Divider */}
            <div className="relative flex py-2 items-center mb-5">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-700" />
              <span className="flex-shrink mx-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Or sign in with
              </span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-700" />
            </div>

            {/* Tab switcher */}
            <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-900 p-1 mb-6">
              <button
                type="button"
                onClick={() => { setTab('email'); clearMessages(); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition
                  ${tab === 'email'
                    ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                <Mail className="w-4 h-4" /> Email & Password
              </button>
              <button
                type="button"
                onClick={() => { setTab('otp'); clearMessages(); setOtpSent(false); setDemoOtp(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition
                  ${tab === 'otp'
                    ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                <Phone className="w-4 h-4" /> OTP Login
              </button>
            </div>

            <ErrorAlert msg={error} />
            <SuccessAlert msg={success} />

            {/* ── EMAIL / PASSWORD TAB ─────────────────────────────────── */}
            {tab === 'email' && (
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email Address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    placeholder="demo@medibot.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600
                      bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none transition text-sm" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium">Password</label>
                    <button type="button"
                      onClick={() => { clearMessages(); setIsForgotView(true); }}
                      className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1">
                      <KeyRound className="w-3.5 h-3.5" /> Forgot password?
                    </button>
                  </div>
                  <PasswordInput id="login-password" value={password} onChange={e => setPassword(e.target.value)} />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600
                    disabled:opacity-50 text-white font-semibold rounded-xl transition shadow-md text-sm">
                  {loading ? 'Authenticating...' : 'Sign In'}
                </button>
              </form>
            )}

            {/* ── OTP TAB ─────────────────────────────────────────────── */}
            {tab === 'otp' && !otpSent && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email or Mobile Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={otpIdentifier}
                      onChange={e => setOtpIdentifier(e.target.value)}
                      required
                      placeholder="+91 9876543210 or email@example.com"
                      className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600
                        bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none transition text-sm"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">We'll send a 6-digit OTP to verify your identity</p>
                </div>
                <button type="submit" disabled={loading || !otpIdentifier.trim()}
                  className="w-full py-3 px-4 bg-gradient-to-r from-teal-600 to-cyan-600
                    hover:from-teal-700 hover:to-cyan-700 disabled:opacity-50 text-white font-bold rounded-xl
                    transition shadow-md text-sm flex items-center justify-center gap-2">
                  <Shield className="w-4 h-4" />
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </form>
            )}

            {tab === 'otp' && otpSent && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                {/* Sent-to badge */}
                <div className="flex items-center justify-between p-3 bg-teal-50 dark:bg-teal-900/20
                  border border-teal-200 dark:border-teal-800 rounded-xl text-sm">
                  <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300 font-medium truncate">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{otpIdentifier}</span>
                  </div>
                  <button type="button" onClick={handleResendOtp}
                    className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 flex-shrink-0 ml-2">
                    <RefreshCw className="w-3 h-3" /> Change
                  </button>
                </div>

                {/* Demo OTP hint box */}
                {demoOtp && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700
                    rounded-xl text-sm text-amber-700 dark:text-amber-300">
                    <p className="font-bold mb-1">🧪 Demo Mode — Your OTP:</p>
                    <p className="text-2xl font-mono font-black tracking-[0.3em] text-amber-600 dark:text-amber-400">
                      {demoOtp}
                    </p>
                    <p className="text-xs mt-1 text-amber-500">In production, this would be sent via SMS/email.</p>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium">Enter 6-Digit OTP</label>
                    {!otpExpired && (
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        Expires in <OTPTimer seconds={300} onExpire={() => setOtpExpired(true)} />
                      </div>
                    )}
                    {otpExpired && (
                      <span className="text-xs font-bold text-rose-500">OTP Expired</span>
                    )}
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    placeholder="_ _ _ _ _ _"
                    className="w-full px-4 py-4 rounded-xl border border-slate-200 dark:border-slate-600
                      bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none transition
                      text-2xl font-mono font-bold tracking-[0.5em] text-center"
                  />
                </div>

                <button type="submit" disabled={loading || otpCode.length < 6 || otpExpired}
                  className="w-full py-3 px-4 bg-gradient-to-r from-teal-600 to-cyan-600
                    hover:from-teal-700 hover:to-cyan-700 disabled:opacity-50 text-white font-bold rounded-xl
                    transition shadow-md text-sm flex items-center justify-center gap-2">
                  <Shield className="w-4 h-4" />
                  {loading ? 'Verifying...' : 'Verify & Sign In'}
                </button>

                {otpExpired && (
                  <button type="button" onClick={handleResendOtp}
                    className="w-full py-3 px-4 border-2 border-teal-500 text-teal-600 dark:text-teal-400
                      font-bold rounded-xl transition text-sm flex items-center justify-center gap-2 hover:bg-teal-50 dark:hover:bg-teal-900/20">
                    <RefreshCw className="w-4 h-4" /> Resend OTP
                  </button>
                )}
              </form>
            )}

            <p className="text-center mt-6 text-sm text-slate-600 dark:text-slate-400">
              Don't have an account?{' '}
              <Link to="/signup" className="text-teal-600 dark:text-teal-400 font-semibold hover:underline">
                Sign up for free
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
