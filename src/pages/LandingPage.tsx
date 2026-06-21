import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Sparkles, BookOpen, Brain, Keyboard, MessageSquare, CheckCircle, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import SEO from '../components/SEO';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const [totalHits, setTotalHits] = useState({ users: 142, sessions: 618 });

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 relative overflow-hidden font-sans">
      <SEO 
        title="College AI Companion" 
        description="StudyNet.AI is the ultimate cognitive student partner platform. Chat with PDF textbooks, unlock course guides, and get real-time answers."
        keywords="studynet, university ai, study bot, smart notes, custom worksheets, chat workspace"
      />
      {/* Decorative Cyber Neon Background Glows */}
      <div className="absolute top-1/4 left-1/12 w-[350px] h-[350px] bg-purple-700/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/10 w-[400px] h-[400px] bg-indigo-600/15 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-[450px] h-[450px] bg-pink-600/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Hero Header */}
      <section className="relative overflow-hidden pt-12 pb-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-12 gap-12 items-center">
            <div className="md:col-span-7 space-y-7">
              <div className="flex flex-wrap gap-3">
                <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 px-4 py-1.5 rounded-full text-xs font-bold text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.15)] select-none">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                  <span className="tracking-wide uppercase">Next-Generation Cognitive Assistant</span>
                </div>
                <div className="inline-flex items-center space-x-2 bg-purple-500/10 border border-purple-500/20 px-4 py-1.5 rounded-full text-xs font-bold text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.15)] select-none hover:scale-105 hover:bg-purple-500/20 hover:text-purple-200 transition-all duration-300 cursor-default">
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                  <span className="tracking-wide uppercase">Founder: Maruti P Ghorpade</span>
                </div>
              </div>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-none text-white">
                Learn Deeper. <br />
                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
                  Understand Faster.
                </span>
              </h1>
              
              <p className="text-sm sm:text-base md:text-md text-slate-400 max-w-xl leading-relaxed">
                Unlock high-fidelity educational workflows with your personal AI study partner. Upload notes, speak complex prompts, and decipher equations with step-by-step visual models on any topic instantly.
              </p>

              <div className="flex flex-wrap gap-4 pt-3">
                {user ? (
                  <Link
                    to={user.role === 'admin' ? '/admin/dashboard' : '/chat'}
                    className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 hover:opacity-90 font-black text-xs uppercase tracking-wider text-white shadow-xl shadow-indigo-950/70 transition-all duration-300 flex items-center space-x-2 border border-indigo-400/20"
                  >
                    <span>Activate Workspace</span>
                    <Sparkles className="w-4 h-4 text-white animate-pulse" />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/register"
                      className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 font-black text-xs uppercase tracking-wider text-white shadow-xl shadow-indigo-950/70 transition-all duration-300 border border-indigo-400/20"
                    >
                      Initialize Free Account
                    </Link>
                    <Link
                      to="/login"
                      className="px-8 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 font-black text-xs uppercase tracking-wider text-slate-300 transition-all duration-300 border border-slate-800/80"
                    >
                      Access Console
                    </Link>
                  </>
                )}
              </div>
              
              <div className="flex items-center space-x-6 text-xs text-slate-400 pt-4 font-mono">
                <div className="flex items-center space-x-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Verified Faculty Persona</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>OCR Diagrams and OCR Analysis</span>
                </div>
              </div>
            </div>

            {/* Visual Panel showing Spline 3D Robotic Greeter (Only robot, no container box card) */}
            <div className="md:col-span-5 col-span-12 flex flex-col items-center justify-center relative px-2 sm:px-6 md:px-0 mx-auto w-full">
              <div className="w-full max-w-sm sm:max-w-md md:max-w-none aspect-square md:aspect-auto h-[380px] sm:h-[480px] md:h-[650px] lg:h-[800px] relative z-20 overflow-hidden rounded-3xl mx-auto">
                <iframe 
                  src="https://my.spline.design/genkubgreetingrobot-1go33TtUIGEh7lAxE2ilazxH/" 
                  frameBorder="0" 
                  width="100%" 
                  height="100%"
                  className="w-full h-full bg-transparent border-0 select-none pointer-events-auto mx-auto scale-[1.12] origin-center translate-x-2 translate-y-2"
                  allow="xr-spatial-tracking"
                  title="Interactive GenKub 3D greeting robot"
                />
                {/* Multi-layered visual safety block to fully mask 'Built with Spline' logo on free viewer tier */}
                <div className="absolute bottom-0 right-0 w-48 h-18 bg-black z-30 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Quick Trial Accounts Panel relocated as a beautiful high-fidelity dashboard row */}
          <div className="mt-16 bg-gradient-to-b from-slate-900/50 to-slate-950/50 p-6 md:p-8 rounded-3xl shadow-3xl border border-slate-800/70 hover:border-indigo-500/30 hover:shadow-[0_25px_50px_-12px_rgba(99,102,241,0.25)] hover:scale-[1.01] transition-all duration-500 text-slate-100 max-w-5xl mx-auto backdrop-blur-xl relative z-10 group overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-indigo-500/10 transition-all duration-500" />
            <div className="sm:flex sm:items-center sm:justify-between border-b border-slate-800/60 pb-5 mb-5">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-mono text-slate-400 pl-2">gateway_credentials_quickstart.bin</span>
              </div>
              <span className="text-[10px] uppercase font-black text-slate-450 tracking-wider">Fast Sandbox Keys</span>
            </div>
            
            <div className="grid md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-4 space-y-2">
                <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center space-x-1.5 whitespace-nowrap">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <span>Simulated Credentials</span>
                </h3>
                <p className="text-xs text-slate-400 leading-normal font-sans">
                  Use these mock accounts to review both the cognitive workspace or the administrator configuration dashboard:
                </p>
              </div>

              <div className="md:col-span-8 grid sm:grid-cols-2 gap-4">
                {/* Student box */}
                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/85 hover:border-indigo-500/20 transition-all duration-300">
                  <div className="text-indigo-400 text-xs font-black mb-2 flex items-center justify-between">
                    <span>👨‍🎓 WORKSPACE ACCOUNT</span>
                    <span className="text-[8px] bg-indigo-500/10 text-indigo-300 font-mono px-2 py-0.5 rounded border border-indigo-500/20">STUDENT ACTIVE</span>
                  </div>
                  <div className="space-y-1 font-mono text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Auth User:</span>
                      <span className="text-white select-all font-semibold">student@studybot.com</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Passphrase:</span>
                      <span className="text-white select-all font-semibold">student123</span>
                    </div>
                  </div>
                </div>

                {/* Admin Box */}
                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/85 hover:border-rose-500/20 transition-all duration-300">
                  <div className="text-rose-400 text-xs font-black mb-2 flex items-center justify-between">
                    <span>🛡️ CONSOLE DIRECTOR (SUPER ADMIN)</span>
                    <span className="text-[8px] bg-rose-500/10 text-rose-300 font-mono px-2 py-0.5 rounded border border-rose-500/20">OWNER ACTIVE</span>
                  </div>
                  <div className="space-y-1 font-mono text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Auth User:</span>
                      <span className="text-white select-all font-semibold">m.p.ghorpade2006@gmail.com</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Passphrase:</span>
                      <span className="text-white select-all font-semibold">super123</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800/50 flex justify-between items-center text-[9px] font-mono text-slate-500">
              <span>SSL Dual SHA-256 secure session encryption active</span>
              <span>Gateway: System 3000 Node</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white text-center mb-12 uppercase tracking-wide">
          Designed for Immersive Cognitive Learning
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 [perspective:1000px]">
          {/* Card 1 */}
          <div className="bg-gradient-to-b from-slate-900/60 to-slate-950/60 p-6 rounded-3xl border border-slate-800/80 hover:border-purple-500/30 hover:shadow-[0_20px_40px_rgba(168,85,247,0.15)] hover:-translate-y-2.5 transition-all duration-500 backdrop-blur-md group relative overflow-hidden">
            <div className="absolute -inset-y-0 -inset-x-0 w-full h-[200%] bg-gradient-to-tr from-transparent via-purple-500/5 to-transparent -translate-y-full group-hover:translate-y-full transition-transform duration-1000 ease-out pointer-events-none" />
            <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400 w-max mb-4 border border-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.1)] group-hover:scale-110 transition-transform duration-300">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-white mb-1.5 transition-colors duration-300 group-hover:text-purple-300">Friendly Tutor Tone</h3>
            <p className="text-xs text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors duration-300">
              Only answers academic topics. Politely steers chats back to course syllabus with helpful, kind analogies.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-gradient-to-b from-slate-900/60 to-slate-950/60 p-6 rounded-3xl border border-slate-800/80 hover:border-indigo-500/30 hover:shadow-[0_20px_40px_rgba(99,102,241,0.15)] hover:-translate-y-2.5 transition-all duration-500 backdrop-blur-md group relative overflow-hidden">
            <div className="absolute -inset-y-0 -inset-x-0 w-full h-[200%] bg-gradient-to-tr from-transparent via-indigo-500/5 to-transparent -translate-y-full group-hover:translate-y-full transition-transform duration-1000 ease-out pointer-events-none" />
            <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 w-max mb-4 border border-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.1)] group-hover:scale-110 transition-transform duration-300">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-white mb-1.5 transition-colors duration-300 group-hover:text-indigo-300">OCR Vision Solvers</h3>
            <p className="text-xs text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors duration-300">
              Upload images of textbook equations, coding scripts, or molecular chemical diagrams for step-by-step guidance.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-gradient-to-b from-slate-900/60 to-slate-950/60 p-6 rounded-3xl border border-slate-800/80 hover:border-pink-500/30 hover:shadow-[0_20px_40px_rgba(236,72,153,0.15)] hover:-translate-y-2.5 transition-all duration-500 backdrop-blur-md group relative overflow-hidden">
            <div className="absolute -inset-y-0 -inset-x-0 w-full h-[200%] bg-gradient-to-tr from-transparent via-pink-500/5 to-transparent -translate-y-full group-hover:translate-y-full transition-transform duration-1000 ease-out pointer-events-none" />
            <div className="p-3 bg-pink-500/10 rounded-2xl text-pink-400 w-max mb-4 border border-pink-500/10 shadow-[0_0_15px_rgba(236,72,153,0.1)] group-hover:scale-110 transition-transform duration-300">
              <Keyboard className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-white mb-1.5 transition-colors duration-300 group-hover:text-pink-300">Voice Transcription</h3>
            <p className="text-xs text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors duration-300">
              Speak mathematical prompt flows easily using built-in high-fidelity speech-to-text Web Speech API adapters.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-gradient-to-b from-slate-900/60 to-slate-950/60 p-6 rounded-3xl border border-slate-800/80 hover:border-cyan-500/30 hover:shadow-[0_20px_40px_rgba(6,182,212,0.15)] hover:-translate-y-2.5 transition-all duration-500 backdrop-blur-md group relative overflow-hidden">
            <div className="absolute -inset-y-0 -inset-x-0 w-full h-[200%] bg-gradient-to-tr from-transparent via-cyan-500/5 to-transparent -translate-y-full group-hover:translate-y-full transition-transform duration-1000 ease-out pointer-events-none" />
            <div className="p-3 bg-cyan-500/10 rounded-2xl text-cyan-400 w-max mb-4 border border-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.1)] group-hover:scale-110 transition-transform duration-300">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-white mb-1.5 transition-colors duration-300 group-hover:text-cyan-300">Console Oversight</h3>
            <p className="text-xs text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors duration-300">
              Monitor active chat thresholds, ban bad actors, update teacher prompt system files, and restrict daily message usage.
            </p>
          </div>
        </div>
      </section>

      {/* Mini CTA Panel */}
      <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 py-16 text-center text-white border-y border-indigo-950/80 relative z-10">
        <div className="max-w-4xl mx-auto px-4">
          <Zap className="w-10 h-10 mx-auto text-indigo-400 mb-4 animate-bounce" />
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider mb-4">Accelerate educational workflows today</h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-sm sm:max-w-md mx-auto mb-8 leading-relaxed">
            Enter the student cockpit to chat, or run administrative control nodes inside the executive deck.
          </p>
          <div className="flex justify-center space-x-3.5">
            <Link
              to="/login"
              className="px-6 py-3 rounded-xl bg-white text-slate-950 hover:bg-slate-100 font-bold text-xs uppercase tracking-wider shadow transition duration-300"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-6 py-3 rounded-xl bg-indigo-600/25 hover:bg-indigo-600 text-indigo-250 font-bold text-xs uppercase tracking-wider border border-indigo-500/30 shadow-md transition duration-300"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 py-8 border-t border-slate-900 text-center text-xs text-slate-500 relative z-10 font-mono">
        <p>© 2026 StudyNet.AI Platform. Founded by Maruti P Ghorpade. Secured via Cryptographic Cloud Host.</p>
      </footer>
    </div>
  );
};
export default LandingPage;
