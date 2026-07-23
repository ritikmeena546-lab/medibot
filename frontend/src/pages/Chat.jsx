import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Menu, Plus, MessageSquare, Send, Sun, Moon, LogOut, 
  Paperclip, AlertTriangle, ArrowLeft, Copy, Check, Sparkles, Shield, 
  Stethoscope, FileText, Activity, Heart, Thermometer, Pill
} from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';

// Medical Markdown Formatter
const FormattedMessage = ({ content }) => {
  if (!content) return null;
  const lines = content.split('\n');
  
  return (
    <div className="formatted-markdown space-y-2 leading-relaxed text-sm sm:text-base">
      {lines.map((line, lineIdx) => {
        let trimmed = line.trim();
        if (!trimmed) return <div key={lineIdx} className="h-1" />;

        // Header ###
        if (trimmed.startsWith && trimmed.startsWith('#')) {
          const headerText = trimmed.replace(/^#+\s*/, '');
          return (
            <h4 key={lineIdx} className="font-bold text-base sm:text-lg text-teal-700 dark:text-teal-300 mt-3 mb-1 flex items-center gap-1.5 border-b border-teal-100 dark:border-teal-900/50 pb-1">
              <Activity className="w-4 h-4 text-teal-500" />
              {headerText}
            </h4>
          );
        }

        // Bullet point - or *
        const isBullet = trimmed.startsWith('* ') || trimmed.startsWith('- ');
        if (isBullet) {
          trimmed = trimmed.replace(/^[*|-]\s*/, '');
        }

        // Parse **bold** inside text
        const parts = trimmed.split(/(\*\*.*?\*\*)/g);
        const renderedText = parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={pIdx} className="font-bold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
          }
          return part;
        });

        if (isBullet) {
          return (
            <div key={lineIdx} className="flex items-start gap-2.5 pl-1 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-2 flex-shrink-0" />
              <span className="text-slate-700 dark:text-slate-200">{renderedText}</span>
            </div>
          );
        }

        return <p key={lineIdx} className="text-slate-700 dark:text-slate-200">{renderedText}</p>;
      })}
    </div>
  );
};

const MEDICAL_SUGGESTIONS = [
  { icon: <Thermometer className="w-4 h-4 text-teal-500" />, title: "Symptom Assessment", text: "I have a high fever, sore throat, and chills for 2 days" },
  { icon: <Pill className="w-4 h-4 text-emerald-500" />, title: "Drug Precautions", text: "What precautions should I take when taking blood pressure medication?" },
  { icon: <FileText className="w-4 h-4 text-cyan-500" />, title: "Lab Report Guidance", text: "How do I interpret high WBC count on a blood test?" },
  { icon: <Heart className="w-4 h-4 text-rose-500" />, title: "Cardiovascular Health", text: "What are warning signs of poor circulation?" }
];

const Chat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  const { logout } = useAuth();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const welcomeMsg = { 
    role: 'assistant', 
    content: '🩺 **Welcome to MediBot Clinical AI!**\n\nI am your dedicated medical & health assistant. I can assist you with:\n* **Symptom Evaluation & Guidance**\n* **Medical PDF Report Analysis**\n* **Health Precautions & Wellness Information**\n\nHow can I assist your health assessment today?' 
  };

  useEffect(() => {
    fetchConversations();
    if (id) {
      fetchMessages(id);
    } else {
      setMessages([welcomeMsg]);
    }
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/chat/conversations');
      setConversations(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMessages = async (convId) => {
    try {
      const res = await api.get(`/chat/conversations/${convId}`);
      setMessages([welcomeMsg, ...res.data.messages]);
    } catch (e) {
      console.error(e);
    }
  };

  const startNewChat = () => {
    navigate('/chat');
    setMessages([welcomeMsg]);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const sendMessageText = async (userMessage) => {
    if (!userMessage.trim() || loading) return;
    
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      let activeId = id;
      if (!activeId) {
        const convRes = await api.post('/chat/conversations', { title: userMessage.substring(0, 30) + '...' });
        activeId = convRes.data.id;
      }

      const res = await api.post(`/chat/conversations/${activeId}/messages`, { content: userMessage });
      
      if (!id) {
        navigate(`/chat/${activeId}`, { replace: true });
        fetchConversations();
      } else {
        setMessages(prev => [...prev, res.data]);
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '⚠️ Unable to connect to the medical assistant service. Please check your connection and try again.', 
        is_emergency: false 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    sendMessageText(input);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
       alert("Only PDF medical report files are supported.");
       return;
    }
    
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      await api.post('/documents/upload', formData, {
         headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `📄 **Medical Report Attached:** \`${file.name}\`\n\nYour lab document has been securely logged. Ask any question regarding specific test parameters or medical terms in your report!`, 
        is_emergency: false 
      }]);
    } catch (e) {
      console.error(e);
      alert("Failed to upload document. Please try again.");
    } finally {
      setLoading(false);
      e.target.value = null;
    }
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 w-full">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)} 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-20 md:hidden transition-opacity"
        />
      )}

      {/* Clinical Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-72 bg-white dark:bg-slate-900 border-r border-teal-100 dark:border-teal-950/60 transform transition-transform duration-300 ease-in-out flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
        <div className="p-4 flex items-center justify-between border-b border-teal-50 dark:border-slate-800">
          <Link to="/" className="flex items-center gap-2.5 text-teal-600 dark:text-teal-400 font-bold text-xl tracking-tight">
            <div className="p-2 bg-teal-500/10 dark:bg-teal-400/10 rounded-xl">
              <Activity className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            </div>
            <span>MediBot</span>
          </Link>
          <Link to="/dashboard" className="p-2 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 rounded-xl hover:bg-teal-50 dark:hover:bg-slate-800 transition" title="Back to Dashboard">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </div>

        <div className="p-4">
          <button 
            onClick={startNewChat} 
            className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 hover:from-teal-700 hover:to-emerald-700 text-white px-4 py-3 rounded-2xl transition font-semibold shadow-md hover:shadow-teal-500/20 active:scale-98"
          >
            <Plus className="h-5 w-5" /> New Consultation
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-3 space-y-1">
          <div className="text-[11px] font-bold text-teal-700/60 dark:text-teal-400/60 uppercase tracking-wider mb-2 px-3 mt-2 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Consultation Records
          </div>
          {conversations.length === 0 ? (
            <div className="text-xs text-slate-400 px-3 py-4 text-center italic">No consultation history</div>
          ) : (
            conversations.slice().reverse().map(c => (
              <Link 
                key={c.id} 
                to={`/chat/${c.id}`} 
                onClick={() => window.innerWidth < 768 && setSidebarOpen(false)} 
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition text-sm group ${id == c.id ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 font-semibold border-l-4 border-teal-500' : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300'}`}
              >
                <MessageSquare className={`h-4 w-4 transition flex-shrink-0 ${id == c.id ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 group-hover:text-teal-500'}`} />
                <span className="truncate">{c.title}</span>
              </Link>
            ))
          )}
        </div>

        <div className="p-4 border-t border-teal-50 dark:border-slate-800 space-y-1">
          <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-teal-50 dark:hover:bg-slate-800 transition text-sm font-medium">
            {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-500" />}
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition text-sm font-medium text-rose-500 hover:text-rose-600">
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      </aside>

      {/* Main Medical Canvas */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-white dark:bg-slate-950 overflow-hidden medical-bg-pattern relative">
        {/* Medical Top Navigation Bar */}
        <header className="h-16 flex-shrink-0 flex items-center justify-between px-4 sm:px-6 border-b border-teal-100 dark:border-teal-950/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 -ml-2 rounded-xl hover:bg-teal-50 dark:hover:bg-slate-800 transition md:hidden">
              <Menu className="h-6 w-6 text-teal-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                <Stethoscope className="w-5 h-5 pulse-medical" />
              </div>
              <div>
                <div className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base flex items-center gap-2">
                  MediBot Clinical AI
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                  </span>
                </div>
                <div className="text-[11px] text-teal-600 dark:text-teal-400 font-medium hidden sm:block">Medical & Diagnostic Guidance Domain Only</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-semibold border border-teal-200/60 dark:border-teal-800/60">
              <Shield className="w-3.5 h-3.5 text-teal-500" /> HIPAA Confidential
            </span>
            <Link to="/dashboard" className="hidden md:flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 transition">
              Dashboard →
            </Link>
          </div>
        </header>

        {/* Message Container - Non-overlapping auto-resizing flex area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 min-h-0">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 sm:gap-4 animate-fade-in ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-md ${msg.is_emergency ? 'bg-rose-600 glow-effect' : 'bg-gradient-to-br from-teal-600 to-emerald-600'}`}>
                    {msg.is_emergency ? <AlertTriangle className="h-5 w-5" /> : <Stethoscope className="h-5 w-5" />}
                  </div>
                )}

                <div className={`group relative max-w-[88%] sm:max-w-[82%] rounded-3xl px-5 py-4 shadow-sm transition-all ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-tr-none shadow-teal-500/10' 
                    : msg.is_emergency 
                      ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-950 dark:text-rose-100 rounded-tl-none border-l-4 border-rose-500 border-t border-r border-b border-rose-200 dark:border-rose-800/60' 
                      : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-tl-none border-l-4 border-teal-500 border-t border-r border-b border-teal-100 dark:border-slate-800 shadow-md shadow-teal-900/5'
                }`}>
                  {msg.is_emergency && (
                    <div className="font-extrabold text-rose-600 dark:text-rose-400 mb-2 flex items-center gap-1.5 text-xs sm:text-sm tracking-wider uppercase border-b border-rose-200 dark:border-rose-800/60 pb-1.5">
                      <AlertTriangle className="w-4 h-4 animate-bounce text-rose-500" /> Urgent Medical Notice
                    </div>
                  )}

                  {msg.role === 'assistant' ? (
                    <div>
                      <div className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                        <Activity className="w-3 h-3" /> Medical Insights
                      </div>
                      <FormattedMessage content={msg.content} />
                    </div>
                  ) : (
                    <div>
                      <div className="text-[10px] font-bold text-teal-200 uppercase tracking-widest mb-1">Patient Inquiry</div>
                      <div className="whitespace-pre-wrap text-sm sm:text-base">{msg.content}</div>
                    </div>
                  )}

                  {/* Copy Button for Assistant */}
                  {msg.role === 'assistant' && (
                    <button 
                      onClick={() => copyToClipboard(msg.content, idx)} 
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-teal-600 dark:hover:text-teal-300 rounded-lg hover:bg-teal-50 dark:hover:bg-slate-800 transition"
                      title="Copy response"
                    >
                      {copiedIdx === idx ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-4 justify-start animate-fade-in">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-600 flex items-center justify-center text-white flex-shrink-0 shadow-md">
                  <Activity className="h-5 w-5 animate-spin" />
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-3xl rounded-tl-none px-5 py-4 border-l-4 border-teal-500 border-t border-r border-b border-teal-100 dark:border-slate-800 flex items-center gap-3 shadow-md">
                  <span className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-bounce"></span>
                  <span className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  <span className="text-xs text-teal-700 dark:text-teal-400 font-semibold ml-1">Evaluating clinical parameters...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Bar & Medical Category Suggestions */}
        <div className="flex-shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-teal-100 dark:border-slate-800 p-4 pt-3 z-10">
          <div className="max-w-3xl mx-auto space-y-3">
            {/* Medical Category Prompt Chips */}
            {messages.length <= 1 && !loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2 animate-fade-in">
                {MEDICAL_SUGGESTIONS.map((s, idx) => (
                  <button 
                    key={idx}
                    onClick={() => sendMessageText(s.text)}
                    className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/80 hover:bg-teal-50 dark:hover:bg-teal-950/40 border border-teal-100 dark:border-teal-900/50 hover:border-teal-300 dark:hover:border-teal-700 rounded-2xl text-left transition-all group shadow-xs"
                  >
                    <div className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-xs group-hover:scale-105 transition-transform">
                      {s.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition">{s.title}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{s.text}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={handleSend} className="relative flex items-center gap-2 bg-slate-50 dark:bg-slate-800/90 rounded-3xl p-2 shadow-md border border-teal-200/80 dark:border-teal-900/60 focus-within:ring-2 focus-within:ring-teal-500/50 focus-within:border-teal-400 transition">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf" className="hidden" />
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()} 
                className="p-3 text-teal-600/70 dark:text-teal-400/70 hover:text-teal-700 dark:hover:text-teal-300 transition rounded-full hover:bg-teal-100/50 dark:hover:bg-slate-700"
                title="Attach PDF Medical Lab Report"
              >
                <Paperclip className="h-5 w-5" />
              </button>
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe your medical symptoms or ask a health question..."
                className="w-full max-h-32 min-h-[44px] bg-transparent resize-none outline-none py-3 px-2 text-slate-900 dark:text-slate-100 text-sm sm:text-base placeholder:text-slate-400"
                rows="1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
              />
              <button 
                type="submit" 
                disabled={!input.trim() || loading} 
                className="p-3 bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 hover:from-teal-700 hover:to-emerald-700 disabled:opacity-40 text-white rounded-full transition shadow-md flex-shrink-0"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>

            <div className="text-center text-[11px] text-teal-800/60 dark:text-teal-300/60 font-medium">
              🩺 MediBot provides medical guidance strictly for health assessment. Consult a physician for formal medical diagnoses.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Chat;
