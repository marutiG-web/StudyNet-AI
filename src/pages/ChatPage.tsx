import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useOfflineSync } from '../context/OfflineSyncContext';
import { ChatSession, ChatMessage } from '../types';
import VoiceInput from '../components/VoiceInput';
import SEO from '../components/SEO';
import { 
  MessageSquare, Plus, Trash2, Send, Paperclip, Image as ImageIcon, 
  X, Sparkles, Brain, Clock, ShieldAlert, GraduationCap, CheckCircle, 
  Sun, Moon, AlertTriangle, ChevronRight, Menu, Loader2 
} from 'lucide-react';

export const ChatPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { isOnline, enqueueAction, cacheData, getCachedData } = useOfflineSync();
  
  // States
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([]);
  
  // Interactive billing simulated checkout states
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [targetPlan, setTargetPlan] = useState<'basic' | 'pro' | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [billingCard, setBillingCard] = useState('');
  const [billingName, setBillingName] = useState('');
  
  const [inputText, setInputText] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<{ name: string; type: string; base64: string } | null>(null);
  const [enableWebSearch, setEnableWebSearch] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sysSettings, setSysSettings] = useState<any>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [localDark, setLocalDark] = useState(true);
  const [quotaCount, setQuotaCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // References
  const fileInputRef = useRef<HTMLInputElement>(null);
  const noteFileInputRef = useRef<HTMLInputElement>(null);
  const bottomScrollRef = useRef<HTMLDivElement>(null);

  // Fetch initial information
  useEffect(() => {
    loadSettings();
    loadSessions();
    if (user) {
      setQuotaCount(user.dailyMessagesCount || 0);
    }
  }, [user]);

  // Sync scroll on new messages
  useEffect(() => {
    bottomScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages, isSending]);

  // Listen for background offline sync completed to reload sessions
  useEffect(() => {
    const handleSyncComplete = () => {
      loadSessions();
    };
    window.addEventListener('studynet_sync_complete', handleSyncComplete);
    return () => {
      window.removeEventListener('studynet_sync_complete', handleSyncComplete);
    };
  }, []);

  const loadSettings = async () => {
    try {
      const res = await api.adminGetSettings();
      if (res.success) {
        setSysSettings(res.settings);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  const loadSessions = async () => {
    try {
      if (!isOnline) {
        const cached = getCachedData<any[]>('chat_sessions', []);
        if (cached && cached.length > 0) {
          setSessions(cached);
          if (!activeSessionId) {
            setActiveSessionId(cached[0].id);
            setCurrentMessages(cached[0].messages || []);
          } else {
            const current = cached.find((s: ChatSession) => s.id === activeSessionId);
            if (current) {
              setCurrentMessages(current.messages || []);
            }
          }
        } else {
          setSessions([]);
        }
        return;
      }
      const res = await api.getSessions();
      if (res.success && res.sessions.length > 0) {
        setSessions(res.sessions);
        cacheData('chat_sessions', res.sessions);
        // Default to first active session if none set
        if (!activeSessionId) {
          setActiveSessionId(res.sessions[0].id);
          setCurrentMessages(res.sessions[0].messages || []);
        } else {
          const current = res.sessions.find((s: ChatSession) => s.id === activeSessionId);
          if (current) {
            setCurrentMessages(current.messages || []);
          }
        }
      } else {
        setSessions([]);
        setActiveSessionId(null);
        setCurrentMessages([]);
      }
    } catch (err) {
      // Offline fallback copy
      const cached = getCachedData<any[]>('chat_sessions', []);
      if (cached && cached.length > 0) {
        setSessions(cached);
      } else {
        setPageError('Failed to fetch chat logs. Reconnecting...');
      }
    }
  };

  const handleCreateSession = async (suggestedTitle?: string) => {
    try {
      setPageError(null);
      const title = suggestedTitle || 'New Study Subject';
      if (!isOnline) {
        const tempId = 'temp-' + Math.random().toString(36).substring(2, 9);
        const optimisticSession: ChatSession = {
          id: tempId,
          userId: user?.id || 'temp-user',
          title,
          messages: [],
          createdAt: new Date().toISOString()
        };
        const updatedSessions = [optimisticSession, ...sessions];
        setSessions(updatedSessions);
        cacheData('chat_sessions', updatedSessions);
        setActiveSessionId(tempId);
        setCurrentMessages([]);
        enqueueAction('create-session', { title });
        if (window.innerWidth < 1024) {
          setSidebarOpen(false); // Auto-hide sidebar in mobile
        }
        return;
      }
      const res = await api.createSession(title);
      if (res.success && res.session) {
        const updatedSessions = [res.session, ...sessions];
        setSessions(updatedSessions);
        cacheData('chat_sessions', updatedSessions);
        setActiveSessionId(res.session.id);
        setCurrentMessages([]);
        if (window.innerWidth < 1024) {
          setSidebarOpen(false); // Auto-hide sidebar in mobile
        }
      }
    } catch (err) {
      setPageError('Failed to initialize a new tutor thread.');
    }
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this study chat session? This cannot be undone.')) return;

    try {
      if (!isOnline) {
        const remaining = sessions.filter(s => s.id !== sessionId);
        setSessions(remaining);
        cacheData('chat_sessions', remaining);
        if (activeSessionId === sessionId) {
          if (remaining.length > 0) {
            setActiveSessionId(remaining[0].id);
            setCurrentMessages(remaining[0].messages || []);
          } else {
            setActiveSessionId(null);
            setCurrentMessages([]);
          }
        }
        enqueueAction('delete-session', { sessionId });
        return;
      }
      const res = await api.deleteSession(sessionId);
      if (res.success) {
        const remaining = sessions.filter(s => s.id !== sessionId);
        setSessions(remaining);
        cacheData('chat_sessions', remaining);
        if (activeSessionId === sessionId) {
          if (remaining.length > 0) {
            setActiveSessionId(remaining[0].id);
            setCurrentMessages(remaining[0].messages || []);
          } else {
            setActiveSessionId(null);
            setCurrentMessages([]);
          }
        }
      }
    } catch (err) {
      setPageError('Could not discard study log.');
    }
  };

  const handleSelectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    const selected = sessions.find(s => s.id === sessionId);
    if (selected) {
      setCurrentMessages(selected.messages || []);
    }
    if (window.innerWidth < 1024) {
      setSidebarOpen(false); // Collapsed on click
    }
    setPageError(null);
  };

  // Convert uploaded image to base64 cleanly
  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Tutor Support: Only academic image uploads (PNG/JPEG/WebP) are compatible.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Tutor Support: Snapshot exceeded 10MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedImage(reader.result as string);
    };
    reader.onerror = () => {
      alert('Failed to parse image file.');
    };
    reader.readAsDataURL(file);
  };

  // Convert uploaded notes (PDF/Text) to base64
  const handleNoteUploadClick = () => {
    noteFileInputRef.current?.click();
  };

  const handleNoteFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Tutor Support: Document file exceeded 10MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const rawRes = reader.result as string;
        const b64 = rawRes.split(',')[1] || rawRes;
        setAttachedFile({
          name: file.name,
          type: file.type || 'application/octet-stream',
          base64: b64
        });
      } catch {
        alert('Failed base64 chunk conversion.');
      }
    };
    reader.onerror = () => {
      alert('Failed to parse document notes.');
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSending || (!inputText.trim() && !attachedImage && !attachedFile)) return;

    let targetSessionId = activeSessionId;

    setIsSending(true);
    setPageError(null);

    try {
      // 1. Auto generate session if missing
      if (!targetSessionId) {
        const titleText = inputText.trim().substring(0, 30);
        const res = await api.createSession(titleText || 'OCR / Voice Study Subject');
        if (res.success && res.session) {
          targetSessionId = res.session.id;
          setActiveSessionId(res.session.id);
          setSessions(prev => [res.session, ...prev]);
        } else {
          throw new Error('Could not initialize study session.');
        }
      }

      const tempText = inputText;
      const tempImg = attachedImage;
      const tempFile = attachedFile;
      setInputText('');
      setAttachedImage(null);
      setAttachedFile(null);

      // Create instant visual optimism
      const clientMsg: ChatMessage = {
        id: 'temp_user_msg',
        role: 'user',
        content: tempText,
        attachedImage: tempImg || undefined,
        attachedFile: tempFile || undefined,
        timestamp: new Date().toISOString()
      };
      setCurrentMessages(prev => [...prev, clientMsg]);

      if (!isOnline) {
        // Mock offline response
        setTimeout(() => {
          const mockModelMsg: ChatMessage = {
            id: 'mock_model_msg_' + Math.random().toString(36).substring(2, 9),
            role: 'model',
            content: `📡 **Offline Mode Activated**\n\nStudyNet has safely cached your question and queued it for synchronization. As soon as you are reconnected to the network, your chat history will be automatically processed, and our AI tutor models will deliver your step-by-step master answers directly.`,
            timestamp: new Date().toISOString()
          };
          setCurrentMessages(prev => {
            const clean = prev.filter(m => m.id !== 'temp_user_msg');
            const optimisticUserCopy = { ...clientMsg, id: 'offline_user_msg_' + Math.random().toString(36).substring(2, 9) };
            return [...clean, optimisticUserCopy, mockModelMsg];
          });
        }, 800);

        enqueueAction('send-message', {
          sessionId: targetSessionId,
          content: tempText,
          attachedImage: tempImg || undefined,
          attachedFile: tempFile || undefined,
          enableWebSearch
        });
        setIsSending(false);
        return;
      }

      // Call API
      const response = await api.sendMessage(targetSessionId, tempText, tempImg || undefined, tempFile || undefined, enableWebSearch);
      
      if (response.success) {
        setCurrentMessages(prev => {
          const cleanPrev = prev.filter(m => m.id !== 'temp_user_msg');
          const newMessages = [];
          if (response.userMessage) newMessages.push(response.userMessage);
          if (response.modelMessage) newMessages.push(response.modelMessage);
          
          const newIds = new Set(newMessages.map(m => m.id));
          return [
            ...cleanPrev.filter(m => !newIds.has(m.id)),
            ...newMessages
          ];
        });
        refreshUser(); // Update quotas
        if (response.dailyMessagesCount !== undefined) {
          setQuotaCount(response.dailyMessagesCount);
        }
        loadSessions(); // update session summaries and titles
      } else {
        // Rollback optimistic message or display error inside conversation
        setCurrentMessages(prev => prev.filter(m => m.id !== 'temp_user_msg'));
        setPageError(response.error || 'The system could not generate an answer.');
      }
    } catch (err: any) {
      setPageError(err.message || 'Network disrupted. Please check server.');
    } finally {
      setIsSending(false);
    }
  };

  const handleVoiceTranscript = (text: string) => {
    setInputText(prev => prev + (prev ? ' ' : '') + text);
  };

  const handleQuickSubject = (subject: string, question: string) => {
    handleCreateSession(subject).then(() => {
      setInputText(question);
    });
  };

  const handleTriggerUpgrade = (plan: 'basic' | 'pro') => {
    setTargetPlan(plan);
    setBillingCard('');
    setBillingName('');
    setIsCheckoutOpen(true);
  };

  const handleConfirmUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPlan) return;

    setIsUpgrading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1200));

      const res = await api.userUpdatePlan(targetPlan);
      if (res.success) {
        setIsCheckoutOpen(false);
        refreshUser();
        alert(`Congratulations! You have successfully upgraded to the ${targetPlan.toUpperCase()} plan! Your daily question limits and feature levels have been upgraded.`);
      } else {
        alert(res.error || 'Simulated transaction could not process.');
      }
    } catch (err: any) {
      alert('Subscription gateway disrupted. Please retry.');
    } finally {
      setIsUpgrading(false);
    }
  };

  // Quota progress math
  let dailyLimit = sysSettings?.freePlanLimit || 5;
  if (user?.plan === 'basic') {
    dailyLimit = sysSettings?.basicPlanLimit || 25;
  } else if (user?.plan === 'pro') {
    dailyLimit = sysSettings?.proPlanLimit || 1000;
  }
  const quotaPercentage = Math.min(100, (quotaCount / dailyLimit) * 100);

  return (
    <div className={`flex h-[calc(100vh-65px)] overflow-hidden ${localDark ? 'bg-slate-900 text-slate-100 dark' : 'bg-slate-50 text-slate-800'}`}>
      <SEO title="Tutor Chatroom" description="Interact with high-fidelity cognitive study partners to review documents, answer mock worksheets, and debug." />
      
      {/* Sidebar - list of chats */}
      <aside className={`bg-white border-r ${localDark ? 'bg-slate-800/80 border-slate-700 text-slate-100' : 'bg-white border-slate-100'} w-80 flex flex-col shrink-0 transition-all duration-300 transform fixed lg:static inset-y-16 lg:inset-auto z-40 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:hidden lg:w-0'}`}>
        
        {/* Sidebar Actions */}
        <div className={`p-4 border-b ${localDark ? 'border-slate-700' : 'border-slate-100'} flex items-center justify-between`}>
          <button
            onClick={() => handleCreateSession()}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition cursor-pointer shadow-md shadow-indigo-100"
          >
            <Plus className="w-4 h-4" />
            <span>New Study Topic</span>
          </button>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Sparkles className="w-8 h-8 text-indigo-400 mx-auto mb-2 animate-pulse" />
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Study Logs Yet</div>
              <p className="text-[11px] text-slate-400 mt-1">Start a conversation to list subjects here.</p>
            </div>
          ) : (
            sessions.map((s) => {
              const isActive = s.id === activeSessionId;
              return (
                <div
                  key={s.id}
                  onClick={() => handleSelectSession(s.id)}
                  className={`group flex items-center justify-between p-3 rounded-xl transition cursor-pointer select-none ${
                    isActive
                      ? (localDark ? 'bg-indigo-900/40 border border-indigo-700/50 text-indigo-300' : 'bg-indigo-50 border border-indigo-100 text-indigo-700')
                      : (localDark ? 'hover:bg-slate-700/50 text-slate-300' : 'hover:bg-slate-100 text-slate-600')
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <div className="text-xs font-medium truncate pr-1">
                      {s.title}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSession(s.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Delete Chat Thread"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Dynamic Subscription Promotion Card / Plan Selector */}
        {user && user.role !== 'admin' && user.role !== 'super_admin' && (
          <div className={`mx-3 mb-2 p-3.5 rounded-2xl border transition-all duration-300 ${
            localDark 
              ? 'bg-slate-705/30 border-slate-700 text-slate-100' 
              : 'bg-indigo-50/50 border-indigo-100 text-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Membership Tier</span>
              </div>
              <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded border tracking-wider ${
                user.plan === 'pro' 
                  ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                  : user.plan === 'basic'
                  ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}>
                {user.plan || 'free'}
              </span>
            </div>

            {/* If Free Plan, suggest upgrading to Basic or Pro */}
            {(user.plan === 'free' || !user.plan) && (
              <div className="space-y-2">
                <div className="text-[11px] font-bold leading-tight">
                  Unlock HD Math Diagrams & OCR!
                </div>
                <p className="text-[10px] text-slate-550 leading-normal">
                  Free limit is {sysSettings?.freePlanLimit || 5} queries. Upgrade now for full academic solutions and deeper file attachment insights!
                </p>
                <div className="pt-1 flex space-x-1.5">
                  <button
                    onClick={() => handleTriggerUpgrade('basic')}
                    className="flex-1 py-1 px-2 text-[9px] font-black uppercase text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition cursor-pointer"
                  >
                    Basic ($9)
                  </button>
                  <button
                    onClick={() => handleTriggerUpgrade('pro')}
                    className="flex-1 py-1 px-2 text-[9px] font-black uppercase text-white bg-gradient-to-r from-purple-600 to-indigo-650 hover:from-purple-700 hover:to-indigo-700 rounded-lg shadow-sm transition cursor-pointer"
                  >
                    Go Pro ($19)
                  </button>
                </div>
              </div>
            )}

            {/* If Basic Plan, suggest upgrading to Pro */}
            {user.plan === 'basic' && (
              <div className="space-y-2">
                <div className="text-[11px] font-bold leading-tight">
                  Upgrade to Unlimited Pro!
                </div>
                <p className="text-[10px] text-slate-550 leading-normal">
                  Unlock {sysSettings?.proPlanLimit || 1000} daily searches, voice inputs, and priority visual OCR breakthroughs.
                </p>
                <button
                  onClick={() => handleTriggerUpgrade('pro')}
                  className="w-full py-1.5 px-3 text-[9px] font-black uppercase text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-750 rounded-lg shadow transition cursor-pointer"
                >
                  Become Pro ($19)
                </button>
              </div>
            )}

            {/* If Pro Plan, show maximum gratitude */}
            {user.plan === 'pro' && (
              <div className="space-y-1.5">
                <div className="text-[11.5px] font-bold text-indigo-600">⚡ Ultimate Academic Access</div>
                <p className="text-[10px] text-slate-550 leading-normal">
                  Supported with the highest model bandwidth and unlimited text diagnostics.
                </p>
                <div className="text-[10px] text-emerald-600 font-bold flex items-center space-x-1">
                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                  <span>Pro perks activated</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer info & Quota trackers */}
        <div className={`p-4 border-t ${localDark ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-slate-50'}`}>
          <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            <span>Daily Active Quota</span>
            <span>{quotaCount} / {dailyLimit} Queries</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden mb-2">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${
                quotaPercentage > 85 ? 'bg-rose-500' : quotaPercentage > 50 ? 'bg-amber-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${quotaPercentage}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Ask homework or study problems. Admins can update this daily messaging ceiling.
          </p>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <main className="flex-1 flex flex-col h-full min-w-0 relative">
        
        {/* Chat top action status bar */}
        <div className={`h-14 px-4 border-b ${localDark ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-white'} flex items-center justify-between shrink-0 relative z-10 shadow-sm`}>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-50 border border-slate-100 mr-1 cursor-pointer"
              title="Toggle Directory"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-1.5">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Academic Instructor</span>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-1" />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Tone filter indicator */}
            <span className={`text-[10px] font-bold uppercase py-0.5 px-2 rounded-full border hidden sm:inline ${
              sysSettings?.chatbotTone === 'academic' 
                ? 'bg-purple-50 text-purple-600 border-purple-200' 
                : 'bg-indigo-50 text-indigo-600 border-indigo-200'
            }`}>
              Tone: {sysSettings?.chatbotTone || 'Friendly'}
            </span>

            {/* Dark mode selector requested */}
            <button
              onClick={() => setLocalDark(!localDark)}
              className={`p-2 rounded-full border transition cursor-pointer ${
                localDark 
                  ? 'bg-slate-700 border-slate-600 text-amber-400 hover:bg-slate-600' 
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
              }`}
              title={localDark ? 'Toggle Light Theme' : 'Toggle Dark Theme'}
            >
              {localDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {pageError && (
            <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-semibold leading-relaxed max-w-2xl mx-auto flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{pageError}</span>
            </div>
          )}

          {currentMessages.length === 0 ? (
            /* Welcome playground cards */
            <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-8">
              <div className="space-y-2">
                <Brain className="w-12 h-12 text-indigo-600 mx-auto animate-bounce" />
                <h2 className="text-2xl font-bold tracking-tight">Need a step-by-step math solver or coding tutor?</h2>
                <p className="text-sm text-slate-500 leading-normal max-w-md mx-auto">
                  Type any question below, upload an equation photo, or voice-dictate homework. Active study blocks prevent non-academic distraction!
                </p>
              </div>

              {/* Sample Quick topics */}
              <div className="grid sm:grid-cols-2 gap-4 text-left">
                <div 
                  onClick={() => handleQuickSubject('Linear Algebra', 'Can you teach me how to solve a system of linear equations using Gaussian Elimination? Give an example.')}
                  className={`p-4 border rounded-2xl cursor-pointer transition flex items-start space-x-3 text-xs ${
                    localDark ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-800' : 'bg-white border-slate-100 hover:border-indigo-300'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold mb-0.5">Gaussian Elimination Math</div>
                    <div className="text-slate-400">Step-by-step Gaussian equation solver breakdown.</div>
                  </div>
                </div>

                <div 
                  onClick={() => handleQuickSubject('Computer Loops', 'What is the big-O complexity of binary search vs linear search, list examples of their respective runtimes.')}
                  className={`p-4 border rounded-2xl cursor-pointer transition flex items-start space-x-3 text-xs ${
                    localDark ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-800' : 'bg-white border-slate-100 hover:border-indigo-300'
                  }`}
                >
                  <Brain className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold mb-0.5">Algorithm Complexity analysis</div>
                    <div className="text-slate-400">Compares search arrays and calculates execution runtimes.</div>
                  </div>
                </div>

                <div 
                  onClick={() => handleQuickSubject('Chemical reactions', 'Explain covalent bonding vs ionic bonding and how carbon atoms configure molecules.')}
                  className={`p-4 border rounded-2xl cursor-pointer transition flex items-start space-x-3 text-xs ${
                    localDark ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-800' : 'bg-white border-slate-100 hover:border-indigo-300'
                  }`}
                >
                  <GraduationCap className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold mb-0.5">Chemistry Molecular bonding</div>
                    <div className="text-slate-400">Chemical properties, valence shells, and atomic octets.</div>
                  </div>
                </div>

                <div 
                  onClick={() => handleQuickSubject('English Rhetoric', 'What are the three core persuasive structures of Aristotle: Ethos, Pathos, and Logos? Give standard examples.')}
                  className={`p-4 border rounded-2xl cursor-pointer transition flex items-start space-x-3 text-xs ${
                    localDark ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-800' : 'bg-white border-slate-100 hover:border-indigo-300'
                  }`}
                >
                  <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold mb-0.5">Persuasive Rhetoric Ethics</div>
                    <div className="text-slate-400">Literature structures, Aristotle appeals, and critical debating.</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              {currentMessages.map((msg, index) => {
                const isUser = msg.role === 'user';
                return (
                  <div key={msg.id || index} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm border ${
                      isUser
                        ? 'bg-indigo-600 border-indigo-700 text-white rounded-br-none'
                        : (localDark 
                             ? 'bg-slate-800 border-slate-700 text-slate-100 rounded-bl-none' 
                             : 'bg-white border-slate-100 text-slate-800 rounded-bl-none')
                    }`}>
                      {/* Optional attached image visual */}
                      {msg.attachedImage && (
                        <div className="mb-2 max-w-xs overflow-hidden rounded-lg border border-indigo-505/20 shadow">
                          <img 
                            src={msg.attachedImage} 
                            alt="Study analysis snapshot" 
                            className="max-h-48 object-cover cursor-zoom-in"
                            referrerPolicy="no-referrer"
                          />
                          <span className="block text-[9px] bg-slate-900/80 text-teal-300 font-mono text-center p-1 font-bold">
                            📷 MULTIMODAL SNAPSHOT SUBMITTED
                          </span>
                        </div>
                      )}

                      {/* Optional attached document notes */}
                      {msg.attachedFile && (
                        <div className={`mb-2 max-w-xs p-2.5 rounded-xl border flex items-center space-x-2 ${
                          isUser 
                            ? 'bg-indigo-700/50 border-indigo-500/40 text-indigo-100' 
                            : 'bg-indigo-950/20 border-indigo-900/30 text-indigo-400'
                        }`}>
                          <Paperclip className="w-4 h-4 shrink-0" />
                          <div className="min-w-0 flex-1 text-left">
                            <div className="text-[11px] font-bold truncate text-white leading-tight">{msg.attachedFile.name}</div>
                            <div className="text-[9px] uppercase font-bold opacity-80 tracking-wider">Document Notes</div>
                          </div>
                        </div>
                      )}

                      {/* Real Verified Academic Diagram / Image Gallery placed first */}
                      {!isUser && msg.diagrams && msg.diagrams.length > 0 && (
                        <div className="mb-4.5 space-y-2 text-left">
                          <div className="flex items-center space-x-1.5 text-[10px] font-extrabold text-teal-400 uppercase tracking-widest">
                            <Sparkles className="w-3.5 h-3.5 shrink-0 text-teal-400" />
                            <span>Verified Academic Reference Diagrams</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            {msg.diagrams.map((diag, dIdx) => (
                              <div 
                                key={dIdx} 
                                className={`group overflow-hidden rounded-xl border transition-all duration-300 shadow hover:shadow-md ${
                                  localDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-205'
                                }`}
                              >
                                <div className="relative aspect-video w-full overflow-hidden bg-slate-950/20">
                                  <img 
                                    src={diag.url} 
                                    alt={diag.title}
                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                                    referrerPolicy="no-referrer"
                                    onClick={() => window.open(diag.url, '_blank')}
                                    title="Click to view full-resolution diagram in a new tab"
                                  />
                                </div>
                                <div className="p-2.5 text-left">
                                  <div className={`text-xs font-bold truncate transition ${
                                    localDark ? 'text-slate-200 group-hover:text-teal-400' : 'text-slate-800 group-hover:text-teal-500'
                                  }`}>
                                    {diag.title}
                                  </div>
                                  <div className="text-[9px] text-slate-500 font-mono mt-0.5 truncate uppercase font-bold tracking-wide">
                                    Trusted Educational Source
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className={`p-2.5 rounded-lg border text-[10px] font-semibold leading-relaxed flex items-start space-x-2 ${
                            localDark ? 'bg-slate-900/50 border-slate-700/60 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'
                          }`}>
                            <GraduationCap className="w-3.5 h-3.5 shrink-0 text-indigo-500 mt-0.5" />
                            <span>These are real, labeled HD visual diagrams loaded directly from peer-reviewed databases corresponding to this subject. Scroll and zoom in on any image above to details labels and structures.</span>
                          </div>
                        </div>
                      )}

                      {/* Text content with white-space formatted code block layouts */}
                      <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-line font-sans">
                        {msg.content}
                      </div>

                      <div className={`text-[9px] font-semibold mt-1.5 flex items-center justify-between ${
                        isUser ? 'text-indigo-200' : 'text-slate-400'
                      }`}>
                        <span>{isUser ? 'Alex Scholar' : 'Instructor bot'}</span>
                        <span className="font-mono">{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {isSending && (
                <div className="flex justify-start">
                  <div className={`max-w-[85%] rounded-2xl rounded-bl-none p-4 shadow-sm border flex items-center space-x-2.5 ${
                    localDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
                  }`}>
                    <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                    <span className="text-xs font-semibold text-slate-400 animate-pulse">
                      Tutor is analysing study materials...
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div ref={bottomScrollRef} />
        </div>

        {/* Input panel controller */}
        <div className={`p-4 border-t ${localDark ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-white'}`}>
          <div className="max-w-3xl mx-auto">
            
            {/* Attachment preview panels */}
            <div className="flex flex-wrap gap-3 mb-3">
              {attachedImage && (
                <div className="flex items-center space-x-3 p-2 border border-dashed border-indigo-200 rounded-xl bg-indigo-50/50 w-max">
                  <div className="relative shrink-0">
                    <img src={attachedImage} alt="homework clip" className="w-12 h-12 rounded-lg object-cover" referrerPolicy="no-referrer" />
                    <button 
                      onClick={() => setAttachedImage(null)}
                      type="button"
                      className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5 shadow-md cursor-pointer hover:bg-rose-600 transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-left text-xs pr-2">
                    <div className="font-bold text-slate-800">Homework Clip Attached</div>
                    <div className="text-[10px] text-slate-400">Gemini Vision solver active</div>
                  </div>
                </div>
              )}

              {attachedFile && (
                <div className="flex items-center space-x-3 p-2 border border-dashed border-indigo-200 rounded-xl bg-indigo-50/50 w-max">
                  <div className="relative shrink-0 bg-indigo-150 bg-indigo-100 w-12 h-12 rounded-lg flex items-center justify-center text-indigo-600">
                    <Paperclip className="w-6 h-6" />
                    <button 
                      onClick={() => setAttachedFile(null)}
                      type="button"
                      className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5 shadow-md cursor-pointer hover:bg-rose-600 transition"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-left text-xs pr-2">
                    <div className="font-bold text-slate-850 text-slate-800 truncate max-w-[150px]">{attachedFile.name}</div>
                    <div className="text-[10px] text-slate-400">Lecture notes active</div>
                  </div>
                </div>
              )}
            </div>

            {/* Realtime Grounded Web Search Panel */}
            <div className="flex items-center justify-between mb-3 bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-md">
              <div className="flex items-center space-x-2.5">
                <div className={`p-1.5 rounded-lg ${enableWebSearch ? 'bg-emerald-950/40 text-emerald-400 animate-pulse' : 'bg-slate-800 text-slate-500'}`}>
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <span>Live Web Grounding</span>
                    {enableWebSearch && (
                      <span className="text-[8px] bg-emerald-950 text-emerald-400 border border-emerald-900/50 px-1 py-0.1 rounded uppercase font-bold tracking-wider animate-bounce ml-1 flex items-center">
                        Active
                      </span>
                    )}
                  </span>
                  <p className="text-[10px] text-slate-400">Interlace academic answers with real-time web news and encyclopedias</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEnableWebSearch(!enableWebSearch)}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  enableWebSearch 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow shadow-emerald-900' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                }`}
              >
                {enableWebSearch ? 'GROUNDING ON' : 'ACTIVATE GROUNDED'}
              </button>
            </div>

            <form onSubmit={handleSend} className="flex items-end space-x-2">
              <div className="flex-1 relative flex items-center">
                
                {/* Input box */}
                <textarea
                  rows={1}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={
                    attachedImage 
                      ? "Describe the snapshot or math problem you want solved..." 
                      : attachedFile
                      ? "Ask questions regarding the uploaded file..."
                      : "Ask math questions, binary array loops, organic history..."
                  }
                  className={`w-full max-h-32 text-xs sm:text-sm pl-4 pr-24 py-3 rounded-2xl resize-none focus:outline-none border focus:ring-2 focus:ring-indigo-500 ${
                    localDark 
                      ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400' 
                      : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                  }`}
                />

                {/* hidden upload attachment link */}
                <input 
                  type="file" 
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />

                <input 
                  type="file" 
                  accept=".pdf,.txt,.doc,.docx,application/pdf,text/plain"
                  ref={noteFileInputRef}
                  onChange={handleNoteFileChange}
                  className="hidden"
                />

                <div className="absolute right-3 flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={handleImageUploadClick}
                    disabled={sysSettings?.enableImageAI === false}
                    className={`p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 transition cursor-pointer ${
                      sysSettings?.enableImageAI === false ? 'opacity-35 cursor-not-allowed' : ''
                    }`}
                    title={sysSettings?.enableImageAI === false ? 'Disabled by Admin' : 'Snap Homework Snapshot'}
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleNoteUploadClick}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                    title="Upload Lecture PDF / Text notes"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Voice input speech-recognition */}
              {sysSettings?.enableVoiceAI !== false && (
                <VoiceInput onTranscript={handleVoiceTranscript} disabled={isSending} />
              )}

              <button
                type="submit"
                disabled={isSending || (!inputText.trim() && !attachedImage && !attachedFile)}
                className="p-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="Send Study Inquiry"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>

            <div className="mt-2 text-center text-[10px] text-slate-450">
              Only academic inputs are allowed. Standard limits: {dailyLimit} requests daily.
            </div>

          </div>
        </div>

      </main>

      {/* Interactive Simulated Modern Checkout Modal */}
      {isCheckoutOpen && targetPlan && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in text-slate-800">
          <div className={`relative max-w-sm w-full rounded-2xl shadow-2xl border p-6 text-left ${
            localDark ? 'bg-slate-800 border-slate-705 text-slate-100' : 'bg-white border-slate-100 text-slate-800'
          }`}>
            <button 
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center pb-4 mb-4 border-b border-slate-100 dark:border-slate-705">
              <div className="inline-flex p-3 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-650 dark:text-indigo-400 rounded-full mb-3">
                <Sparkles className="w-6 h-6 text-indigo-600 animate-pulse" />
              </div>
              <h3 className="text-md font-extrabold">Complete Student Upgrade</h3>
              <p className="text-[11px] text-slate-400 mt-1">Unlock premium high-fidelity tools on your StudyBot profile.</p>
            </div>

            <form onSubmit={handleConfirmUpgrade} className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-705 flex justify-between items-center text-xs text-slate-700 dark:text-slate-350">
                <div>
                  <span className="text-slate-405">Target Plan: </span>
                  <span className="font-bold underline text-indigo-650 dark:text-indigo-400 uppercase tracking-wide ml-1">
                    {targetPlan}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-405">Price: </span>
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    {targetPlan === 'basic' ? '$9.00 / mo' : '$19.00 / mo'}
                  </span>
                </div>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Mock Cardholder Name</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. John Doe, BA"
                  value={billingName}
                  onChange={(e) => setBillingName(e.target.value)}
                  className={`w-full px-3 py-1.5 text-xs rounded-xl border focus:ring-1 focus:ring-indigo-500 focus:outline-none ${
                    localDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Simulated Credit Card Number</label>
                <input 
                  type="text"
                  required
                  placeholder="xxxx xxxx xxxx 4111"
                  value={billingCard}
                  onChange={(e) => setBillingCard(e.target.value)}
                  className={`w-full px-3 py-1.5 text-xs rounded-xl border focus:ring-1 focus:ring-indigo-500 focus:outline-none ${
                    localDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Expiration</label>
                  <input 
                    type="text"
                    required
                    maxLength={5}
                    placeholder="MM/YY"
                    className={`w-full px-3 py-1.5 text-xs rounded-xl border focus:ring-1 focus:ring-indigo-500 focus:outline-none ${
                      localDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Security Code CVV</label>
                  <input 
                    type="password"
                    required
                    maxLength={3}
                    placeholder="***"
                    className={`w-full px-3 py-1.5 text-xs rounded-xl border focus:ring-1 focus:ring-indigo-500 focus:outline-none ${
                      localDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 text-[9.5px] text-emerald-700 dark:text-emerald-400 leading-normal flex items-start space-x-1.5 text-left">
                <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-500 mt-0.5" />
                <span>Sandbox secure mode: Payment simulation is activated. No actual money transactions occur. Persistent inside local DB.</span>
              </div>

              <div className="pt-2 flex justify-between space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    localDark ? 'bg-slate-700 border-slate-600 hover:bg-slate-600' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpgrading}
                  className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 transition flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  {isUpgrading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Subscribe Now</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
export default ChatPage;
