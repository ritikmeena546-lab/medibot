import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageSquare, FileText, ShieldAlert, UserCheck, 
  ArrowRight, Stethoscope, Clock, Sparkles 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';

const Dashboard = () => {
  const { user } = useAuth();
  const [convCount, setConvCount] = useState(0);
  const [docCount, setDocCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [convRes, docRes] = await Promise.all([
          api.get('/chat/conversations'),
          api.get('/api/documents/').catch(() => ({ data: [] }))
        ]);
        setConvCount(convRes.data.length);
        setDocCount(docRes.data?.length || 0);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow w-full space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold mb-3 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> MediBot Health Dashboard
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {getGreeting()}, <span className="underline decoration-cyan-300 underline-offset-4">{user?.email?.split('@')[0]}</span>!
            </h1>
            <p className="text-blue-100 mt-2 text-sm sm:text-base max-w-xl">
              Access your medical consultations, manage report uploads, and check symptoms with AI guidance.
            </p>
          </div>
          <Link 
            to="/chat" 
            className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 hover:bg-blue-50 px-6 py-3.5 rounded-2xl font-bold transition shadow-lg active:scale-98"
          >
            <Stethoscope className="w-5 h-5 text-blue-600" /> Start Consultation
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <DashCard icon={<MessageSquare className="w-6 h-6 text-blue-500" />} title="Consultations" value={loading ? "..." : convCount} subtitle="Saved Chat Sessions" />
        <DashCard icon={<FileText className="w-6 h-6 text-cyan-500" />} title="Medical Reports" value={loading ? "..." : docCount} subtitle="Uploaded Documents" />
        <DashCard icon={<UserCheck className="w-6 h-6 text-emerald-500" />} title="Account Status" value="Active" subtitle="Secure JWT Auth" />
        <DashCard icon={<Clock className="w-6 h-6 text-purple-500" />} title="AI Domain" value="Medical Only" subtitle="Strict Boundaries" />
      </div>

      {/* Main Content Grid */}
      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Column: Quick Actions */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 dark:border-slate-700/80 space-y-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-blue-500" /> Quick Actions
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <QuickActionCard 
                to="/chat"
                title="Symptom Check"
                description="Describe symptoms to get instant medical considerations and guidance."
                btnText="Check Symptoms"
                color="blue"
              />
              <QuickActionCard 
                to="/chat"
                title="Upload Report"
                description="Upload a PDF lab or diagnostic report to ask questions."
                btnText="Upload PDF"
                color="cyan"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Medical Disclaimer Notice */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 rounded-3xl p-6 border border-amber-200/70 dark:border-amber-800/50 space-y-4">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-base">
              <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400" /> Medical Disclaimer
            </div>
            <p className="text-xs sm:text-sm text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
              MediBot provides AI-assisted informational guidance strictly for health education and symptom awareness. It does not replace professional medical diagnosis or emergency care.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const DashCard = ({ icon, title, value, subtitle }) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-700/80 hover:shadow-md transition">
    <div className="flex items-center gap-4">
      <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-2xl">
        {icon}
      </div>
      <div>
        <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{title}</div>
        <div className="text-2xl font-extrabold text-slate-900 dark:text-white">{value}</div>
        <div className="text-[11px] text-slate-400 mt-0.5">{subtitle}</div>
      </div>
    </div>
  </div>
);

const QuickActionCard = ({ to, title, description, btnText, color }) => (
  <Link to={to} className="group p-5 rounded-2xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200/70 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition flex flex-col justify-between space-y-4">
    <div>
      <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">{title}</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{description}</p>
    </div>
    <div className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400">
      {btnText} <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
    </div>
  </Link>
);

export default Dashboard;
