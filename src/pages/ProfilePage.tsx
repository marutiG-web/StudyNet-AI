import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Calendar, User, Mail, Award, CheckCircle, Shield, AwardIcon, Brain } from 'lucide-react';
import SEO from '../components/SEO';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [sessionsCount, setSessionsCount] = useState(0);
  const [limits, setLimits] = useState(15);

  useEffect(() => {
    loadProfileStats();
  }, [user?.plan]);

  const loadProfileStats = async () => {
    try {
      const res = await api.getSessions();
      if (res.success) {
        setSessionsCount(res.sessions.length);
      }
      const settingsRes = await api.adminGetSettings();
      if (settingsRes.success) {
        let planLimit = settingsRes.settings.dailyLimitPerUser || 15;
        if (user) {
          if (user.plan === 'free') planLimit = settingsRes.settings.freePlanLimit || 5;
          else if (user.plan === 'basic') planLimit = settingsRes.settings.basicPlanLimit || 25;
          else if (user.plan === 'pro') planLimit = settingsRes.settings.proPlanLimit || 1000;
        }
        setLimits(planLimit);
      }
    } catch (err) {
      console.error('Failed to load profile parameters', err);
    }
  };

  const handleFastUpgrade = async (plan: 'basic' | 'pro') => {
    if (window.confirm(`Would you like to authorize a mock sandbox purchase of the ${plan.toUpperCase()} tier for complete features expansion?`)) {
      try {
        const res = await api.userUpdatePlan(plan);
        if (res.success) {
          refreshUser();
          alert(`Success! Upgraded to ${plan.toUpperCase()} plan. Your new limit is fully applied!`);
          loadProfileStats();
        } else {
          alert('Could not update status. Please try again.');
        }
      } catch {
        alert('Network disrupted.');
      }
    }
  };

  if (!user) return null;

  return (
    <div className="bg-slate-950 min-h-[calc(100vh-65px)] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans text-slate-100">
      <SEO title="My Student profile" description="Manage your StudyNet.AI account profile, track learning quotas, and check active subscriptions." />
      {/* Decorative Cyber Neon Background Glows */}
      <div className="absolute top-1/4 left-1/12 w-[350px] h-[350px] bg-purple-700/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/10 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-3xl mx-auto relative z-10">
        <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-slate-800/80 shadow-2xl relative overflow-hidden">
          
          {/* Cover card with neon gradient mesh */}
          <div className="bg-gradient-to-r from-indigo-950 via-purple-950 to-pink-950 h-32 relative border-b border-indigo-500/10">
            <div className="absolute -bottom-8 left-6">
              <div className="h-20 w-20 rounded-2xl bg-slate-900 border-4 border-slate-950 shadow-lg flex items-center justify-center font-black text-2xl text-indigo-400 select-none">
                {user.username.charAt(0).toUpperCase()}
              </div>
            </div>
            {/* Ambient indicator */}
            <div className="absolute top-4 right-4 flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full text-[10px] font-bold text-indigo-300 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping" />
              <span>Verified Scholar Card</span>
            </div>
          </div>

          <div className="pt-12 px-6 pb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-black text-white leading-tight uppercase tracking-tight">
                  {user.username}
                </h1>
                <p className="text-xs text-slate-400 capitalize tracking-wide font-mono mt-1">
                  Academic Roll: <span className="text-indigo-300 bg-indigo-505/10 bg-indigo-500/10 px-2.5 py-0.5 rounded-md border border-indigo-500/20">{user.role}</span>
                </p>
              </div>
              <div className="flex items-center space-x-1.5 text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl text-xs font-bold border border-emerald-500/20 select-none">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Account Active</span>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-950/60 p-4 rounded-xl text-center border border-slate-800">
                <div className="text-2xl font-black text-indigo-400">{sessionsCount}</div>
                <div className="text-[10px] uppercase font-bold text-slate-400 mt-1 font-mono">Study Sessions</div>
              </div>
              <div className="bg-slate-950/60 p-4 rounded-xl text-center border border-slate-800">
                <div className="text-2xl font-black text-indigo-400">{user.dailyMessagesCount || 0}</div>
                <div className="text-[10px] uppercase font-bold text-slate-400 mt-1 font-mono">Queries Today</div>
              </div>
              <div className="bg-slate-950/60 p-4 rounded-xl text-center border border-slate-800">
                <div className="text-2xl font-black text-indigo-400">{limits - (user.dailyMessagesCount || 0)}</div>
                <div className="text-[10px] uppercase font-bold text-slate-400 mt-1 font-mono">Remaining Quota</div>
              </div>
              <div className="bg-slate-950/60 p-4 rounded-xl text-center border border-slate-800">
                <div className="text-2xl font-black text-emerald-400 font-sans">Grade A</div>
                <div className="text-[10px] uppercase font-bold text-slate-400 mt-1 font-mono">Tutor Standing</div>
              </div>
            </div>

            {/* SaaS Subscription Promotion Card */}
            {user && user.role !== 'admin' && user.role !== 'super_admin' && (
              <div className="mt-8 p-6 bg-gradient-to-r from-indigo-950/45 to-purple-950/45 rounded-2xl border border-indigo-500/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1 text-left">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-indigo-300 bg-indigo-500/15 px-2.5 py-0.5 rounded-full border border-indigo-500/20 uppercase tracking-widest font-mono">
                      {user.plan || 'Free'} Plan Active
                    </span>
                    <span className="text-slate-500 text-xs">|</span>
                    <span className="text-xs font-semibold text-slate-400">Allocated Quota: {limits} daily messages</span>
                  </div>
                  <h3 className="text-base font-bold text-white leading-snug">Level up your Student Capability Card</h3>
                  <p className="text-xs text-slate-400 max-w-md leading-normal">
                    Get HD custom visual math diagrams, voice typing solvers, bigger notes uploads, and bypass limit restrictions dynamically.
                  </p>
                </div>

                {user.plan !== 'pro' ? (
                  <div className="flex sm:flex-row gap-2 shrink-0">
                    {user.plan === 'free' && (
                      <button
                        onClick={() => handleFastUpgrade('basic')}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-850 transition shadow-sm cursor-pointer whitespace-nowrap uppercase tracking-wider"
                      >
                        Get Basic ($9)
                      </button>
                    )}
                    <button
                      onClick={() => handleFastUpgrade('pro')}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-90 transition shadow-md cursor-pointer whitespace-nowrap uppercase tracking-wider"
                    >
                      Go Pro ($19)
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/20 shrink-0">
                    <CheckCircle className="w-4 h-4 text-emerald-555 text-emerald-400" />
                    <span>Ultimate Access Active</span>
                  </div>
                )}
              </div>
            )}

            {/* Account Information */}
            <div className="mt-8 border-t border-slate-900 pt-6 space-y-4">
              <h3 className="text-xs font-bold text-slate-550 text-slate-500 uppercase tracking-widest font-mono">
                Student Registration Details
              </h3>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3.5 text-sm bg-slate-950/30 p-3 rounded-xl border border-slate-900/50">
                  <Mail className="w-5 h-5 text-slate-500" />
                  <div>
                    <div className="text-slate-500 text-xs font-mono">Email Address</div>
                    <div className="font-semibold text-slate-205 text-slate-200">{user.email}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3.5 text-sm bg-slate-950/30 p-3 rounded-xl border border-slate-900/50">
                  <Calendar className="w-5 h-5 text-slate-500" />
                  <div>
                    <div className="text-slate-500 text-xs font-mono">Join Date</div>
                    <div className="font-semibold text-slate-205 text-slate-200">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3.5 text-sm bg-slate-950/30 p-3 rounded-xl border border-slate-900/50">
                  <User className="w-5 h-5 text-slate-500" />
                  <div>
                    <div className="text-slate-500 text-xs font-mono">Student ID</div>
                    <div className="font-semibold text-indigo-400 font-mono text-xs">{user.id}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3.5 text-sm bg-slate-950/30 p-3 rounded-xl border border-slate-900/50">
                  <Brain className="w-5 h-5 text-slate-500" />
                  <div>
                    <div className="text-slate-500 text-xs font-mono">Daily Limit Allocation</div>
                    <div className="font-semibold text-slate-205 text-slate-200">{limits} queries/day</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Achievement Badges */}
            <div className="mt-8 border-t border-slate-900 pt-6">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 font-mono">
                Learning Milestones
              </h3>
              <div className="flex flex-wrap gap-2.5">
                <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  📚 Math Scholar
                </span>
                <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  🔬 Physics Enthusiast
                </span>
                <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-pink-500/10 text-pink-300 border border-pink-500/20">
                  💻 Code Solver
                </span>
                <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  ⚡ Daily Streak Active
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
export default ProfilePage;
