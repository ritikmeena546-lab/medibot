import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Brain, FileText, ArrowRight } from 'lucide-react';

const Landing = () => {
  return (
    <div className="flex-grow flex flex-col">
      {/* Hero Section */}
      <main className="flex-grow flex items-center justify-center bg-gradient-to-br from-blue-50 to-white dark:from-slate-900 dark:to-slate-800 px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-semibold mb-6 animate-fade-in-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Powered by Gemini 2.5 Flash
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 text-slate-900 dark:text-white leading-tight">
            Your Intelligent <br className="hidden md:block"/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Medical AI Assistant</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-10 max-w-2xl mx-auto">
            Get instant medical guidance, analyze your health reports, and detect emergency symptoms safely with our state-of-the-art AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all shadow-xl hover:shadow-blue-500/25">
              Start Chatting <ArrowRight className="h-5 w-5" />
            </Link>
            <Link to="/dashboard" className="flex items-center justify-center px-8 py-4 rounded-full text-lg font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm">
              View Dashboard
            </Link>
          </div>
        </div>
      </main>

      {/* Features */}
      <section className="py-24 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            <FeatureCard icon={<Brain className="h-8 w-8 text-blue-500"/>} title="Smart Symptom Checker" description="Describe your symptoms naturally and receive medically-guided next steps and insights." />
            <FeatureCard icon={<FileText className="h-8 w-8 text-cyan-500"/>} title="Report Analysis" description="Upload PDF medical reports securely to get simplified explanations of your results." />
            <FeatureCard icon={<ShieldCheck className="h-8 w-8 text-emerald-500"/>} title="Safety First" description="Built-in emergency detection protocols that immediately advise when to seek urgent care." />
          </div>
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 hover:shadow-xl transition-shadow duration-300 group">
    <div className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-2xl inline-block shadow-sm group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-3">{title}</h3>
    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>
  </div>
);

export default Landing;
