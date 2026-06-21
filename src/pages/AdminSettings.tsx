import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import AdminSidebar from '../components/AdminSidebar';
import { 
  Settings, Save, Sparkles, Sliders, ToggleLeft, ToggleRight, 
  HelpCircle, CheckCircle, Brain, AlertOctagon, ShieldAlert, Loader2 
} from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Settings states
  const [systemPrompt, setSystemPrompt] = useState('');
  const [enableImageAI, setEnableImageAI] = useState(true);
  const [enableVoiceAI, setEnableVoiceAI] = useState(true);
  const [enableOTPVerification, setEnableOTPVerification] = useState(true);
  const [dailyLimitPerUser, setDailyLimitPerUser] = useState(15);
  const [chatbotTone, setChatbotTone] = useState<'friendly' | 'academic' | 'rigorous' | 'encouraging'>('friendly');

  // Subscription plan states
  const [freePlanLimit, setFreePlanLimit] = useState(5);
  const [basicPlanLimit, setBasicPlanLimit] = useState(25);
  const [proPlanLimit, setProPlanLimit] = useState(1000);
  
  const [enableImageFree, setEnableImageFree] = useState(false);
  const [enableImageBasic, setEnableImageBasic] = useState(true);
  const [enableImagePro, setEnableImagePro] = useState(true);

  const [enableFileFree, setEnableFileFree] = useState(false);
  const [enableFileBasic, setEnableFileBasic] = useState(false);
  const [enableFilePro, setEnableFilePro] = useState(true);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      navigate('/admin/login');
      return;
    }
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.adminGetSettings();
      if (res.success && res.settings) {
        const s = res.settings;
        setSystemPrompt(s.systemPrompt || '');
        setEnableImageAI(s.enableImageAI !== false);
        setEnableVoiceAI(s.enableVoiceAI !== false);
        setEnableOTPVerification(s.enableOTPVerification !== false);
        setDailyLimitPerUser(s.dailyLimitPerUser || 15);
        setChatbotTone(s.chatbotTone || 'friendly');

        setFreePlanLimit(s.freePlanLimit !== undefined ? s.freePlanLimit : 5);
        setBasicPlanLimit(s.basicPlanLimit !== undefined ? s.basicPlanLimit : 25);
        setProPlanLimit(s.proPlanLimit !== undefined ? s.proPlanLimit : 1000);

        setEnableImageFree(!!s.enableImageFree);
        setEnableImageBasic(s.enableImageBasic !== false);
        setEnableImagePro(s.enableImagePro !== false);

        setEnableFileFree(!!s.enableFileFree);
        setEnableFileBasic(!!s.enableFileBasic);
        setEnableFilePro(s.enableFilePro !== false);
      } else {
        setError(res.error || 'Failed to sync AI settings.');
      }
    } catch {
      setError('AI controller offline. Please inspect node connections.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaveSuccess(false);
    setIsSaving(true);

    try {
      const res = await api.adminUpdateSettings({
        systemPrompt,
        enableImageAI,
        enableVoiceAI,
        enableOTPVerification,
        dailyLimitPerUser: Number(dailyLimitPerUser),
        chatbotTone,
        freePlanLimit: Number(freePlanLimit),
        basicPlanLimit: Number(basicPlanLimit),
        proPlanLimit: Number(proPlanLimit),
        enableImageFree,
        enableImageBasic,
        enableImagePro,
        enableFileFree,
        enableFileBasic,
        enableFilePro
      });

      if (res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setError(res.error || 'Failed to update system behaviors.');
      }
    } catch {
      setError('Failed to deploy changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const setPresetPrompt = (preset: 'strict_academic' | 'casual_teacher' | 'rigorous_examiner') => {
    if (preset === 'strict_academic') {
      setSystemPrompt(
        `You are a strict academic instructor. Only solve STEM or humanities, give extensive definitions, and strictly enforce the syllabus. Reject unapproved queries with high academic directness.`
      );
      setChatbotTone('academic');
    } else if (preset === 'casual_teacher') {
      setSystemPrompt(
        `You are a warm, casual, and energetic study friend. Break solutions down, motivate with emojis, and provide relatable real-world study analogies for grade-school concepts!`
      );
      setChatbotTone('friendly');
    } else if (preset === 'rigorous_examiner') {
      setSystemPrompt(
        `You are an SAT/ACT examination specialist. Coach students, focus on optimization parameters, teach mathematical formulas, and test them with questions in real-time.`
      );
      setChatbotTone('rigorous');
    }
  };

  return (
    <div className="bg-slate-950 min-h-[calc(100vh-65px)] text-slate-100 flex flex-col md:flex-row">
      <AdminSidebar />

      <main className="flex-1 p-6 sm:p-8 overflow-y-auto space-y-6">
        
        {/* Banner */}
        <div className="border-b border-slate-900 pb-5">
          <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center space-x-2">
            <Settings className="w-6 h-6 text-indigo-500 shrink-0" />
            <span>AI Brain System Prompt Controller</span>
          </h1>
          <p className="text-xs text-slate-400">Configure core system instructions, personality filters, and access controls dynamically.</p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-950/40 border border-rose-900/40 text-rose-300 rounded-xl text-xs flex items-center space-x-2">
            <AlertOctagon className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {saveSuccess && (
          <div className="p-3.5 bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 rounded-xl text-xs flex items-center space-x-2 font-bold animate-bounce">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>Settings deployed successfully! Model parameters updated in live session.</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <span className="text-sm text-slate-450 pr-2">Syncing brain parameters...</span>
          </div>
        ) : (
          <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
            
            {/* Primary Settings Form */}
            <div className="lg:col-span-8 space-y-6">
              
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800/80 space-y-4 shadow-xl">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Custom LLM System Instruction (Secret Teacher Prompt)
                  </label>
                  <p className="text-[10px] text-slate-500 mb-2 leading-relaxed">
                    This blocks off-topic requests and guides model demeanor. Changes deploy instantly without compiling!
                  </p>
                  <textarea
                    rows={8}
                    required
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    className="w-full text-xs font-mono p-4 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-505 focus:ring-indigo-500 leading-relaxed resize-none"
                    placeholder="Enter custom tutor rules..."
                  />
                </div>

                {/* Pre-made shortcuts */}
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Load quick instruction shortcuts
                  </span>
                  <div className="flex flex-wrap gap-2 text-center">
                    <button
                      type="button"
                      onClick={() => setPresetPrompt('strict_academic')}
                      className="px-3 py-1.5 bg-purple-950/30 hover:bg-purple-950/50 border border-purple-900 rounded-lg text-[10px] font-bold text-purple-400 transition cursor-pointer"
                    >
                      Strict Academic Dean
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetPrompt('casual_teacher')}
                      className="px-3 py-1.5 bg-indigo-950/30 hover:bg-indigo-950/50 border border-indigo-900 rounded-lg text-[10px] font-bold text-indigo-400 transition cursor-pointer"
                    >
                      Friendly Study Buddy
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetPrompt('rigorous_examiner')}
                      className="px-3 py-1.5 bg-amber-950/30 hover:bg-amber-950/50 border border-amber-900 rounded-lg text-[10px] font-bold text-amber-400 transition cursor-pointer"
                    >
                      SAT Prep Examiner
                    </button>
                  </div>
                </div>
              </div>

              {/* SaaS Subscription Plans & Limits Controls */}
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800/80 space-y-4 shadow-xl text-slate-100">
                <div className="border-b border-slate-800 pb-2">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>SaaS Subscription Plan Settings</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1">Configure subscription plans, set daily message limits, and toggle feature levels.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Free Plan */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-3">
                    <h4 className="text-xs font-bold text-slate-350 text-slate-300 flex items-center justify-between">
                      <span>FREE PLAN</span>
                      <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">Default Tier</span>
                    </h4>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1 font-semibold uppercase">Daily Quota Limit</label>
                      <input
                        type="number"
                        min="0"
                        value={freePlanLimit}
                        onChange={(e) => setFreePlanLimit(Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="space-y-1.5 pt-1">
                      <label className="flex items-center space-x-2 text-[10px] text-slate-400 select-none cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enableImageFree}
                          onChange={(e) => setEnableImageFree(e.target.checked)}
                          className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                        />
                        <span>Enable Image AI</span>
                      </label>
                      <label className="flex items-center space-x-2 text-[10px] text-slate-400 select-none cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enableFileFree}
                          onChange={(e) => setEnableFileFree(e.target.checked)}
                          className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                        />
                        <span>Enable File Notes</span>
                      </label>
                    </div>
                  </div>

                  {/* Basic Plan */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-indigo-950/45 space-y-3">
                    <h4 className="text-xs font-bold text-indigo-305 text-indigo-300 flex items-center justify-between">
                      <span>BASIC PLAN</span>
                      <span className="text-[9px] bg-indigo-950/60 px-1.5 py-0.5 rounded text-indigo-400 font-bold">Standard Tier</span>
                    </h4>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1 font-semibold uppercase">Daily Quota Limit</label>
                      <input
                        type="number"
                        min="0"
                        value={basicPlanLimit}
                        onChange={(e) => setBasicPlanLimit(Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="space-y-1.5 pt-1">
                      <label className="flex items-center space-x-2 text-[10px] text-slate-400 select-none cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enableImageBasic}
                          onChange={(e) => setEnableImageBasic(e.target.checked)}
                          className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                        />
                        <span>Enable Image AI</span>
                      </label>
                      <label className="flex items-center space-x-2 text-[10px] text-slate-400 select-none cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enableFileBasic}
                          onChange={(e) => setEnableFileBasic(e.target.checked)}
                          className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                        />
                        <span>Enable File Notes</span>
                      </label>
                    </div>
                  </div>

                  {/* Pro Plan */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-amber-950/45 space-y-3">
                    <h4 className="text-xs font-bold text-amber-305 text-amber-300 flex items-center justify-between">
                      <span>PRO PLAN</span>
                      <span className="text-[9px] bg-amber-950/60 px-1.5 py-0.5 rounded text-amber-400 font-bold">Scholar Pro</span>
                    </h4>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1 font-semibold uppercase">Daily Quota Limit</label>
                      <input
                        type="number"
                        min="0"
                        value={proPlanLimit}
                        onChange={(e) => setProPlanLimit(Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="space-y-1.5 pt-1">
                      <label className="flex items-center space-x-2 text-[10px] text-slate-400 select-none cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enableImagePro}
                          onChange={(e) => setEnableImagePro(e.target.checked)}
                          className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                        />
                        <span>Enable Image AI</span>
                      </label>
                      <label className="flex items-center space-x-2 text-[10px] text-slate-400 select-none cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enableFilePro}
                          onChange={(e) => setEnableFilePro(e.target.checked)}
                          className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                        />
                        <span>Enable File Notes</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Threshold controls */}
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800/80 grid sm:grid-cols-2 gap-6 shadow-xl">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    User Daily Message Limit Quota (Global Override)
                  </label>
                  <p className="text-[10px] text-slate-500 mb-2 leading-tight">
                    Standard fallback quota cap per profile if plan thresholds are bypass disabled.
                  </p>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    required
                    value={dailyLimitPerUser}
                    onChange={(e) => setDailyLimitPerUser(Number(e.target.value))}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Model Temperature Tone Preset
                  </label>
                  <p className="text-[10px] text-slate-500 mb-2 leading-tight">
                    Changes randomness. Rigorous limits creativity for exact math equations.
                  </p>
                  <select
                    value={chatbotTone}
                    onChange={(e: any) => setChatbotTone(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-550 focus:ring-indigo-500"
                  >
                    <option value="friendly">Friendly Encouraging (Low temperature: 0.7)</option>
                    <option value="academic">Academic Solver (Lower temperature: 0.2)</option>
                    <option value="rigorous">Mathematical Certainty (Lowest temperature: 0.3)</option>
                    <option value="encouraging">Motivational Mentor (Highest temperature: 0.85)</option>
                  </select>
                </div>
              </div>

              {/* Deploy save */}
              <div>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:w-max px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-indigo-100 transition cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Deploying Instructions...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Deploy AI Parameters</span>
                    </>
                  )}
                </button>
              </div>

            </div>

            {/* Feature Modules Toggles (Side panel representation) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800/80 space-y-6 shadow-xl">
                
                <h3 className="text-sm font-bold uppercase tracking-wider mb-2 flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  <span>Module Toggles</span>
                </h3>

                {/* Toggle Image Solvers */}
                <div className="flex items-start justify-between">
                  <div className="mr-4">
                    <h4 className="text-xs font-bold text-white">Active Gemini Image Solvers</h4>
                    <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                      Disable/Enable client paperclip OCR homework snapshot capabilities.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEnableImageAI(!enableImageAI)}
                    className="p-1 text-slate-400 hover:text-indigo-400 transition cursor-pointer"
                  >
                    {enableImageAI ? (
                      <ToggleRight className="w-10 h-10 text-indigo-500 shrink-0" />
                    ) : (
                      <ToggleLeft className="w-10 h-10 text-slate-600 shrink-0" />
                    )}
                  </button>
                </div>

                {/* Toggle Voice Transcription */}
                <div className="flex items-start justify-between border-t border-slate-850 pt-4">
                  <div className="mr-4">
                    <h4 className="text-xs font-bold text-white">Active Web Speech API</h4>
                    <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                      Disable/Enable client micro-audio voice dictation typing utilities.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEnableVoiceAI(!enableVoiceAI)}
                    className="p-1 text-slate-400 hover:text-indigo-400 transition cursor-pointer"
                  >
                    {enableVoiceAI ? (
                      <ToggleRight className="w-10 h-10 text-indigo-500 shrink-0" />
                    ) : (
                      <ToggleLeft className="w-10 h-10 text-slate-600 shrink-0" />
                    )}
                  </button>
                </div>

                {/* Toggle Student OTP Verification */}
                <div className="flex items-start justify-between border-t border-slate-800 pt-4">
                  <div className="mr-4">
                    <h4 className="text-xs font-bold text-white">Student OTP Verification</h4>
                    <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                      Force a 6-digit verification code check before unlocking chatbot usage.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEnableOTPVerification(!enableOTPVerification)}
                    className="p-1 text-slate-400 hover:text-indigo-400 transition cursor-pointer"
                  >
                    {enableOTPVerification ? (
                      <ToggleRight className="w-10 h-10 text-indigo-500 shrink-0" />
                    ) : (
                      <ToggleLeft className="w-10 h-10 text-slate-600 shrink-0" />
                    )}
                  </button>
                </div>

              </div>

              {/* Dynamic model details card */}
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3 font-mono text-[11px] text-slate-500">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 font-sans">
                  Current Session Pipeline
                </div>
                <div className="flex justify-between">
                  <span>AI Vision Model:</span>
                  <span className="text-indigo-405 text-indigo-400 font-bold">gemini-3.5-flash</span>
                </div>
                <div className="flex justify-between">
                  <span>AI Text Model:</span>
                  <span className="text-indigo-405 text-indigo-400 font-bold">gemini-3.5-flash</span>
                </div>
                <div className="flex justify-between">
                  <span>SSL Channel:</span>
                  <span className="text-emerald-400 font-bold font-sans text-[10px]">Secure Gateway</span>
                </div>
              </div>
            </div>

          </form>
        )}

      </main>
    </div>
  );
};
export default AdminSettings;
