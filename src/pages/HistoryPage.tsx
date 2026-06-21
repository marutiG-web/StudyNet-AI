import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { ChatSession } from '../types';
import { MessageSquare, Calendar, ChevronRight, Trash2, Tag, BookOpen, Brain, Sparkles, Loader2 } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const res = await api.getSessions();
      if (res.success) {
        setSessions(res.sessions);
      }
    } catch (err) {
      setError('Failed to fetch historical session diaries.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!window.confirm('Delete this lesson history entirely?')) return;

    try {
      const res = await api.deleteSession(sessionId);
      if (res.success) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
      }
    } catch (err) {
      setError('Could not delete history element.');
    }
  };

  return (
    <div className="bg-slate-950 min-h-[calc(100vh-65px)] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans text-slate-100">
      {/* Decorative Cyber Neon Background Glows */}
      <div className="absolute top-1/4 left-1/12 w-[350px] h-[350px] bg-purple-700/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/10 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="flex md:items-center justify-between flex-col md:flex-row space-y-4 md:space-y-0 mb-8 pb-6 border-b border-slate-900">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white uppercase tracking-wide">
              Your <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">Educational Logs</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-1">Review past transcripts, textbook inquiries, and instructor formulas.</p>
          </div>
          <Link
            to="/chat"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-650 hover:opacity-95 font-black text-white transition text-xs flex items-center space-x-2 tracking-wider uppercase shadow-[0_4px_15px_rgba(99,102,241,0.2)] w-max cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Enter Studio Room</span>
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-2xl text-xs font-semibold">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
            <span className="text-xs font-mono uppercase tracking-widest text-slate-500">Restoring logs...</span>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/35 border border-slate-900 rounded-3xl p-8 max-w-xl mx-auto">
            <BookOpen className="w-12 h-12 text-slate-700 mx-auto mb-4 animate-bounce" />
            <h3 className="text-lg font-bold text-white uppercase tracking-wide">Workbook is empty</h3>
            <p className="text-xs text-slate-450 max-w-sm mx-auto mt-2 mb-6 leading-relaxed">
              You haven't initiated any tutor streams yet. Post school assignments to capture historic logs here.
            </p>
            <Link
              to="/chat"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-black text-xs tracking-wider uppercase shadow-md transition cursor-pointer"
            >
              Start Your First Lesson
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => navigate('/chat')}
                className="block bg-slate-950/65 p-5 rounded-2xl border border-slate-900 hover:border-indigo-500/30 transition-all duration-300 cursor-pointer group hover:shadow-[0_4px_15px_rgba(99,102,241,0.05)]"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-3">
                      <MessageSquare className="w-4 h-4 text-indigo-400 shrink-0" />
                      <h3 className="font-extrabold text-sm sm:text-base text-white truncate group-hover:text-indigo-400 transition-colors">
                        {s.title}
                      </h3>
                      <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/10">
                        {s.messages?.length || 0} explanations
                      </span>
                    </div>

                    <div className="mt-3.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-slate-400 text-xs font-mono">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{new Date(s.createdAt).toLocaleDateString()} {new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 font-bold text-indigo-400 text-[11px] uppercase tracking-wider">
                        <Tag className="w-3 h-3 text-indigo-400" />
                        <span>Subject: Academic Tutorial</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 pl-4">
                    <button
                      onClick={(e) => handleDeleteSession(s.id, e)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Discard Log Thread"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <ChevronRight className="w-5 h-5 text-slate-600 group-hover:translate-x-1 group-hover:text-white transition" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default HistoryPage;
