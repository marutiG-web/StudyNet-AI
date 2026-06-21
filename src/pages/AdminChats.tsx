import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import AdminSidebar from '../components/AdminSidebar';
import { 
  MessageSquare, Trash2, Calendar, User, Mail, 
  Trash, ShieldAlert, AlertTriangle, Eye, Loader2 
} from 'lucide-react';

export const AdminChats: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [allSessions, setAllSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      navigate('/admin/login');
      return;
    }
    loadAllSessions();
  }, [user]);

  const loadAllSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.adminGetChats();
      if (res.success) {
        setAllSessions(res.sessions);
        if (res.sessions.length > 0) {
          // Sync current selection if existing
          if (selectedSession) {
            const current = res.sessions.find((s: any) => s.id === selectedSession.id);
            setSelectedSession(current || res.sessions[0]);
          } else {
            setSelectedSession(res.sessions[0]);
          }
        } else {
          setSelectedSession(null);
        }
      } else {
        setError(res.error || 'Failed to list audit sessions.');
      }
    } catch {
      setError('Chat logging database connection interrupted.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!window.confirm('Are you sure you want to delete this ENTIRE study thread from database storage? This is irreversible.')) return;

    try {
      const res = await api.adminDeleteSession(sessionId);
      if (res.success) {
        setAllSessions(prev => prev.filter(s => s.id !== sessionId));
        if (selectedSession?.id === sessionId) {
          setSelectedSession(null);
        }
        alert('Study thread purged successfully.');
        loadAllSessions();
      } else {
        alert(res.error || 'Purging chat logs aborted.');
      }
    } catch {
      alert('Delete net disruption.');
    }
  };

  const handleDeleteMessage = async (sessionId: string, messageId: string) => {
    if (!window.confirm('Purge this single message from logs?')) return;

    try {
      const res = await api.adminDeleteMessage(sessionId, messageId);
      if (res.success) {
        // optimistically wipe message
        if (selectedSession?.id === sessionId) {
          setSelectedSession((prev: any) => ({
            ...prev,
            messages: prev.messages.filter((m: any) => m.id !== messageId)
          }));
        }
        alert('Message deleted from log thread.');
        loadAllSessions();
      } else {
        alert(res.error || 'Wiping message failed.');
      }
    } catch {
      alert('Wiping network error.');
    }
  };

  return (
    <div className="bg-slate-950 min-h-[calc(100vh-65px)] text-slate-100 flex flex-col md:flex-row">
      <AdminSidebar />

      <main className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden shrink-0">
        
        {/* Left List Pane */}
        <div className="w-full lg:w-96 border-r border-slate-900 bg-slate-900/40 p-4 shrink-0 flex flex-col h-[calc(100vh-65px)] overflow-y-auto">
          <div className="mb-4">
            <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-indigo-500 shrink-0" />
              <span>Audit Classroom Logs</span>
            </h1>
            <p className="text-[11px] text-slate-400">View active student conversations, textbook clips, and off-topic questions.</p>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-950/40 border border-rose-900/40 text-rose-300 rounded-xl text-xs flex items-center space-x-2 shrink-0 mb-4 animate-shake">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mr-2" />
              <span className="text-xs text-slate-450">Synchronizing...</span>
            </div>
          ) : allSessions.length === 0 ? (
            <div className="text-center py-24 text-slate-500 font-mono text-xs">
              0 Active educational logs parsed.
            </div>
          ) : (
            <div className="space-y-2 flex-1">
              {allSessions.map((s) => {
                const isSelected = s.id === selectedSession?.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSession(s)}
                    className={`p-3 rounded-xl transition cursor-pointer select-none border text-left flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-900 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-350 hover:bg-slate-850'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-slate-500 font-mono truncate mr-2">
                          ID: {s.id}
                        </span>
                        <span className="text-[9px] bg-slate-800 text-slate-400 py-0.5 px-1.5 rounded font-mono font-bold shrink-0">
                          {s.messages?.length || 0} items
                        </span>
                      </div>
                      <h4 className="font-bold text-xs truncate mt-1 text-slate-200">
                        {s.title}
                      </h4>
                      <div className="text-[10px] text-indigo-400 mt-2 font-bold flex items-center space-x-1">
                        <User className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{s.username}</span>
                      </div>
                    </div>

                    <div className="mt-2 text-[10px] text-slate-500 font-mono flex items-center justify-between border-t border-slate-850/50 pt-2">
                      <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(s.id);
                        }}
                        className="text-rose-500 hover:text-rose-450 p-1 rounded hover:bg-rose-950/30 transition cursor-pointer"
                        title="Purge Entire Thread"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Detail Pane */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col h-[calc(100vh-65px)] overflow-y-auto">
          {selectedSession ? (
            <div className="flex-1 flex flex-col min-h-0 space-y-4">
              
              {/* Header profile details */}
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                <div className="min-w-0">
                  <span className="text-[9px] font-bold text-indigo-400 tracking-widest uppercase">INSIGHT AUDITING</span>
                  <h2 className="text-sm font-extrabold text-white truncate mt-0.5">
                    {selectedSession.title}
                  </h2>
                  <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    <span className="flex items-center space-x-1">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>{selectedSession.username}</span>
                    </span>
                    <span className="flex items-center space-x-1 text-slate-400">
                      <Mail className="w-3.5 h-3.5 text-slate-500 font-mono" />
                      <span>{selectedSession.email}</span>
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={() => handleDeleteSession(selectedSession.id)}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 text-[10px] font-bold border border-rose-900/60 rounded-lg transition cursor-pointer w-max shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>PURGE CONVERSATION</span>
                </button>
              </div>

              {/* Message thread inspector */}
              <div className="flex-1 bg-slate-950/50 border border-slate-900 rounded-2xl p-4 overflow-y-auto space-y-4">
                {selectedSession.messages === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500 font-mono">
                    Thread holds zero payloads.
                  </div>
                ) : (
                  selectedSession.messages.map((m: any, index: number) => {
                    const isUser = m.role === 'user';
                    return (
                      <div key={m.id || index} className="p-4 bg-slate-900 rounded-xl border border-slate-850 hover:border-slate-800 relative group transition">
                        
                        {/* Delete single message trigger */}
                        <button
                          onClick={() => handleDeleteMessage(selectedSession.id, m.id)}
                          className="opacity-0 group-hover:opacity-100 absolute top-3 right-3 text-slate-500 hover:text-rose-400 p-1.5 hover:bg-rose-950/35 border border-transparent hover:border-rose-955/35 rounded-lg transition cursor-pointer"
                          title="Purge Single Message"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex items-center space-x-2 text-[10px] font-bold tracking-wider uppercase mb-1">
                          <span className={isUser ? 'text-indigo-400' : 'text-emerald-400'}>
                            {isUser ? '👨‍🎓 Student Inquirer' : '💡 AI Instructor'}
                          </span>
                          <span className="text-slate-500 font-mono">
                            {m.timestamp ? new Date(m.timestamp).toLocaleTimeString() : ''}
                          </span>
                        </div>

                        {/* OCR Image Attachment Preview */}
                        {m.attachedImage && (
                          <div className="mb-2 max-w-xs rounded overflow-hidden border border-slate-800 shadow">
                            <img src={m.attachedImage} alt="textbook screenshot" className="max-h-36 object-cover" referrerPolicy="no-referrer" />
                          </div>
                        )}

                        <p className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-line">
                          {m.content}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-900 rounded-2xl py-24">
              <Eye className="w-12 h-12 text-slate-800 mb-2 animate-pulse" />
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select Study Record</div>
              <p className="text-[10px] text-slate-450 text-slate-400 max-w-xs text-center mt-1">
                Select a classroom record session from the navigator menu to inspect student inputs and audit messages.
              </p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
};
export default AdminChats;
