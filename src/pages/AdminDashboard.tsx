import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { SystemStats } from '../types';
import AdminSidebar from '../components/AdminSidebar';
import { 
  Users, MessageSquare, ShieldAlert, BarChart3, AlertOctagon, 
  Activity, ArrowUpRight, GraduationCap, Server, HelpCircle, Loader2 
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Role based security checks
    if (!user) {
      navigate('/admin/login');
      return;
    }
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      setError('Access Denied. Secret administrative credentials required.');
      setLoading(false);
      return;
    }
    loadStats();
  }, [user]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const res = await api.adminGetStats();
      if (res.success) {
        setStats(res.stats);
      } else {
        setError(res.error || 'Failed to load system monitors.');
      }
    } catch (err) {
      setError('Monitors offline. Check node connection.');
    } finally {
      setLoading(false);
    }
  };

  if (error && (!user || (user.role !== 'admin' && user.role !== 'super_admin'))) {
    return (
      <div className="bg-slate-900 min-h-screen text-white flex items-center justify-center p-6">
        <div className="bg-slate-950 p-8 rounded-2xl border border-rose-900/40 text-center max-w-md">
          <AlertOctagon className="w-12 h-12 text-rose-500 mx-auto mb-4 animate-ping" />
          <h2 className="text-xl font-bold tracking-tight mb-2">Security Intervention</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            {error}
          </p>
          <button
            onClick={() => navigate('/admin/login')}
            className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold transition cursor-pointer"
          >
            Authenticate Admin Credentials
          </button>
        </div>
      </div>
    );
  }

  // Calculate highest chart hit for responsive SVG scaling
  const maxCount = stats?.usageByDay ? Math.max(...stats.usageByDay.map(d => d.count), 1) : 10;

  return (
    <div className="bg-slate-950 min-h-[calc(100vh-65px)] text-slate-100 flex flex-col md:flex-row">
      <AdminSidebar />

      <main className="flex-1 p-6 sm:p-8 overflow-y-auto space-y-8 font-sans">
        
        {/* Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center space-x-2">
              <span>Performance Monitor Control</span>
              <Activity className="w-5 h-5 text-indigo-500 shrink-0" />
            </h1>
            <p className="text-xs text-slate-400">Governance of AI classroom quotas, student blocklists, and teacher persona systems.</p>
          </div>
          <div className="flex items-center space-x-2 text-xs bg-slate-900/65 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-450 font-mono text-slate-400">
            <Server className="w-3.5 h-3.5 text-indigo-400 mr-1 shrink-0" />
            <span>Dev Server: v1.0 Container</span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mr-3" />
            <span className="text-sm text-slate-450">Scanning database logs...</span>
          </div>
        ) : !stats ? (
          <div className="p-4 bg-slate-905 border border-slate-800 text-rose-300 rounded-xl text-xs">
            Monitor state offline. Please verify standard database directory assets exist.
          </div>
        ) : (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Students</span>
                  <Users className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black">{stats.totalUsers}</div>
                <div className="text-[10px] text-slate-500 mt-1.5 flex items-center">
                  <span>Enrolled inside portals</span>
                </div>
              </div>

              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Subject Threads</span>
                  <MessageSquare className="w-4 h-4 text-violet-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black">{stats.totalChats}</div>
                <div className="text-[10px] text-slate-500 mt-1.5 flex items-center">
                  <span>Coursework subject logs</span>
                </div>
              </div>

              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Instructor Queries</span>
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black">{stats.totalMessages}</div>
                <div className="text-[10px] text-slate-500 mt-1.5 flex items-center">
                  <span>Total tokens solved</span>
                </div>
              </div>

              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Banned Students</span>
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-rose-500">{stats.bannedUsers}</div>
                <div className="text-[10px] text-slate-500 mt-1.5 flex items-center">
                  <span>Abusive script blocklist</span>
                </div>
              </div>

            </div>

            {/* SVG Interactive Chart bento section */}
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800/80">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider">Instructor Usage History (Daily Tokens)</h3>
                  <p className="text-[11px] text-slate-500">Academic chat submissions logged over the last active days.</p>
                </div>
                <div className="flex items-center space-x-2 text-[10px] text-slate-450 text-slate-400 font-mono">
                  <div className="w-2.5 h-2.5 rounded bg-indigo-505 bg-indigo-500" />
                  <span>Queries Solved</span>
                </div>
              </div>

              {/* Pure SVG Bar chart */}
              <div className="h-64 w-full flex items-end">
                <svg className="w-full h-full" viewBox="0 0 700 240" preserveAspectRatio="none">
                  {/* Grid lines */}
                  <line x1="0" y1="40" x2="700" y2="40" stroke="#1e293b" strokeWidth="1" strokeDasharray="3,3" />
                  <line x1="0" y1="100" x2="700" y2="100" stroke="#1e293b" strokeWidth="1" strokeDasharray="3,3" />
                  <line x1="0" y1="160" x2="700" y2="160" stroke="#1e293b" strokeWidth="1" strokeDasharray="3,3" />
                  <line x1="0" y1="210" x2="700" y2="210" stroke="#334155" strokeWidth="1.5" />

                  {stats.usageByDay.map((d, index) => {
                    const barWidth = 45;
                    const spacing = 100;
                    const x = index * spacing + 40;
                    const barHeight = (d.count / maxCount) * 150; // Max height 150px
                    const y = 210 - barHeight;

                    return (
                      <g key={d.date} className="group/bar cursor-pointer">
                        {/* Tooltip background on hover */}
                        <rect 
                          x={x - 10} 
                          y="10" 
                          width={barWidth + 20} 
                          height="198" 
                          fill="#1e293b" 
                          opacity="0" 
                          className="hover:opacity-10 transition duration-250" 
                          rx="4"
                        />
                        {/* Active rounded bar */}
                        <rect
                          x={x}
                          y={y}
                          width={barWidth}
                          height={barHeight || 2} // at least 2px visual block
                          fill="url(#indigoGrad)"
                          rx="6"
                          className="hover:fill-indigo-400 transition"
                        />
                        {/* Numerical text on top */}
                        <text
                          x={x + barWidth / 2}
                          y={y - 8}
                          textAnchor="middle"
                          fill="#818cf8"
                          fontSize="10"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          {d.count}
                        </text>
                        {/* Horizontal Date axis label */}
                        <text
                          x={x + barWidth / 2}
                          y="228"
                          textAnchor="middle"
                          fill="#64748b"
                          fontSize="9"
                          fontWeight="bold"
                          fontFamily="sans-serif"
                        >
                          {d.date.substring(5)} {/* MM-DD */}
                        </text>
                      </g>
                    );
                  })}

                  {/* Gradient definition */}
                  <defs>
                    <linearGradient id="indigoGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.2" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            {/* Quick help instructions */}
            <div className="grid md:grid-cols-2 gap-6 pt-2">
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
                <h3 className="font-bold text-sm uppercase tracking-wider mb-2 flex items-center space-x-2">
                  <Server className="w-4 h-4 text-indigo-400" />
                  <span>Administrative Guidelines</span>
                </h3>
                <ul className="space-y-2.5 text-xs text-slate-400 leading-normal">
                  <li className="flex items-start space-x-2">
                    <span className="text-indigo-400 font-bold">1.</span>
                    <span>To toggle banned accounts, head to <strong>Govern Students</strong>. Banned accounts immediately lose API gateway capabilities securely.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-indigo-400 font-bold">2.</span>
                    <span>Go to <strong>Audit Chat Logs</strong> to delete inappropriate messages. This keeps the training and prompt history clean.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-indigo-400 font-bold">3.</span>
                    <span>Modify instructions instantly via <strong>Instruct AI Prompts</strong>. New guidelines feed directly to the model on the very next response!</span>
                  </li>
                </ul>
              </div>

              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm uppercase tracking-wider mb-2 flex items-center space-x-2">
                    <HelpCircle className="w-4 h-4 text-emerald-400" />
                    <span>Dev Server Status</span>
                  </h3>
                  <div className="space-y-2 text-xs text-slate-400 font-mono">
                    <div className="flex justify-between">
                      <span>Node Engine:</span>
                      <span className="text-emerald-400 font-bold">V8 Active</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gateway Mode:</span>
                      <span className="text-emerald-400 font-bold">Vite HMR Ingress</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CORS Security:</span>
                      <span className="text-indigo-400 font-bold">RBAC Restrict headers</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Database persistence:</span>
                      <span className="text-indigo-400 font-bold">Disk (src/db/db.json)</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-[9px] text-slate-500 font-mono">
                  <span>System clock synchronized</span>
                  <span>Port: 3000 online</span>
                </div>
              </div>
            </div>
          </>
        )}

      </main>
    </div>
  );
};
export default AdminDashboard;
