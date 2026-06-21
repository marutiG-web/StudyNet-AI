import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { User } from '../types';
import AdminSidebar from '../components/AdminSidebar';
import { 
  Users, Trash, ShieldAlert, Ban, Unlock, RefreshCw, 
  Search, ShieldCheck, Mail, Calendar, AlertCircle, Loader2 
} from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [usersList, setUsersList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [quotaInputs, setQuotaInputs] = useState<{ [userId: string]: string }>({});

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      navigate('/admin/login');
      return;
    }
    loadUsers();
  }, [user]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.adminGetUsers();
      if (res.success) {
        setUsersList(res.users);
        // Pre-fill inputs with current daily counts
        const inputsMap: { [key: string]: string } = {};
        res.users.forEach((u: User) => {
          inputsMap[u.id] = String(u.dailyMessagesCount || 0);
        });
        setQuotaInputs(inputsMap);
      } else {
        setError(res.error || 'Failed to fetch registered student roll.');
      }
    } catch (err) {
      setError('Student roll sync failure. Try refreshing.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBan = async (targetUserId: string) => {
    if (targetUserId === 'usr_superadmin') {
      alert('Tutor Protection: Main supervisor profile cannot be blacklisted.');
      return;
    }

    try {
      const res = await api.adminToggleBan(targetUserId);
      if (res.success && res.user) {
        setUsersList(prev => prev.map(u => u.id === targetUserId ? { ...u, isBanned: res.user.isBanned } : u));
      } else {
        alert(res.error || 'Failed to apply block threshold.');
      }
    } catch {
      alert('Block execution error.');
    }
  };

  const handleUpdateRole = async (targetUserId: string, newRole: 'user' | 'admin' | 'super_admin') => {
    try {
      const res = await api.adminUpdateRole(targetUserId, newRole);
      if (res.success && res.user) {
        setUsersList(prev => prev.map(u => u.id === targetUserId ? { ...u, role: newRole } : u));
        alert('Academic rank promoted successfully!');
      } else {
        alert(res.error || 'Role amendment was rejected.');
      }
    } catch {
      alert('Role transition execution error.');
    }
  };

  const handleUpdatePlan = async (targetUserId: string, newPlan: 'free' | 'basic' | 'pro') => {
    try {
      const res = await api.adminUpdatePlan(targetUserId, newPlan);
      if (res.success && res.user) {
        setUsersList(prev => prev.map(u => u.id === targetUserId ? { ...u, plan: newPlan } : u));
        alert('Student subscription tier modified successfully!');
      } else {
        alert(res.error || 'Subscription amendment was rejected.');
      }
    } catch {
      alert('Subscription transition execution error.');
    }
  };

  const handleDeleteUser = async (targetUserId: string) => {
    const confirmation = window.confirm(
      'DATABASE DISINTEGRATION ACTION: Are you absolutely certain you want to permanently erase this user profile? All related chat messages, documents, voice clips, and memory indexes will be wiped out from core server storage. This is irreversible!'
    );
    if (!confirmation) return;

    try {
      const res = await api.adminDeleteUser(targetUserId);
      if (res.success) {
        setUsersList(prev => prev.filter(u => u.id !== targetUserId));
        alert('User account purged completely from registry.');
      } else {
        alert(res.error || ' Purge operation rejected.');
      }
    } catch {
      alert('Purge account network error.');
    }
  };

  const handleUpdateQuotaInputChange = (userId: string, val: string) => {
    setQuotaInputs(prev => ({ ...prev, [userId]: val }));
  };

  const handleSaveQuota = async (userId: string) => {
    const rawVal = quotaInputs[userId];
    const parsedVal = Number(rawVal);
    if (isNaN(parsedVal) || parsedVal < 0) {
      alert('Quota Error: Count must be a positive integer.');
      return;
    }

    try {
      const res = await api.adminUpdateQuota(userId, parsedVal);
      if (res.success && res.user) {
        setUsersList(prev => prev.map(u => u.id === userId ? { ...u, dailyMessagesCount: parsedVal } : u));
        alert('Daily limit quota successfully configured.');
      } else {
        alert(res.error || 'Quota amendment refused.');
      }
    } catch {
      alert('Quota network error.');
    }
  };

  const handleUpdateVerification = async (targetUserId: string, currentVerifiedStatus: boolean) => {
    try {
      const newVerifiedStatus = !currentVerifiedStatus;
      const res = await api.adminUpdateVerification(targetUserId, newVerifiedStatus);
      if (res.success) {
        setUsersList(prev => prev.map(u => u.id === targetUserId ? { ...u, isVerified: newVerifiedStatus, otpAttempts: 0 } : u));
        alert('Verification status changed successfully!');
      } else {
        alert(res.error || 'Failed to apply verification override.');
      }
    } catch {
      alert('Verification override network error.');
    }
  };

  const filteredUsers = usersList.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-slate-950 min-h-[calc(100vh-65px)] text-slate-100 flex flex-col md:flex-row">
      <AdminSidebar />

      <main className="flex-1 p-6 sm:p-8 overflow-y-auto space-y-6">
        
        {/* Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-5">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center space-x-2">
              <Users className="w-6 h-6 text-indigo-500 shrink-0" />
              <span>Govern Student Roll</span>
            </h1>
            <p className="text-xs text-slate-400">Suspend academic accounts, audit quotas, and trace registration timelines.</p>
          </div>
          
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs placeholder-slate-550 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
            />
          </div>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-950/40 border border-rose-900/40 text-rose-300 rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <span className="text-sm text-slate-450 pr-2">Auditing student registries...</span>
          </div>
        ) : (
          <div className="bg-slate-900 rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl">
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/45 text-slate-400 uppercase tracking-wider font-bold">
                    <th className="p-4">Student Profile</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Subscription Plan</th>
                    <th className="p-4">Daily Usage</th>
                    <th className="p-4">Registered</th>
                    <th className="p-4 th-actions text-right">Governing Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 font-mono">
                        No matches found inside database indexes.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr 
                        key={u.id}
                        className={`hover:bg-slate-850/40 transition ${
                          u.isBanned ? 'bg-red-950/15' : ''
                        }`}
                      >
                        {/* Student profile card */}
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-9 h-9 rounded-xl font-bold flex items-center justify-center border font-mono ${
                              u.role === 'super_admin'
                                ? 'bg-amber-950/55 border-amber-900/50 text-amber-400'
                                : u.role === 'admin' 
                                ? 'bg-rose-950/55 border-rose-900/50 text-rose-400' 
                                : 'bg-indigo-950/55 border-indigo-900/50 text-indigo-400'
                            }`}>
                              {u.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-white flex items-center space-x-1.5">
                                <span>{u.username}</span>
                                {u.isBanned && (
                                  <span className="text-[9px] bg-rose-950 border border-rose-900 px-1 py-0.2 rounded text-rose-400 font-semibold uppercase tracking-wider">
                                    SUSPENDED
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono flex items-center space-x-1">
                                <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                                <span>{u.email}</span>
                              </div>
                              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                {u.isVerified ? (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] bg-emerald-950/40 border border-emerald-900/40 px-1.5 py-0.5 rounded text-emerald-400 font-bold">
                                    <ShieldCheck className="w-2.5 h-2.5" />
                                    VERIFIED
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] bg-amber-950/40 border border-amber-900/45 px-1.5 py-0.5 rounded text-amber-400 font-bold">
                                    <ShieldAlert className="w-2.5 h-2.5" />
                                    UNVERIFIED
                                  </span>
                                )}
                                
                                {u.otpAttempts !== undefined && u.otpAttempts > 0 && (
                                  <span className="text-[9px] bg-rose-950/30 border border-rose-900/30 px-1.5 py-0.5 rounded text-rose-300 font-mono">
                                    {u.otpAttempts} failed OTP attempts
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role box */}
                        <td className="p-4">
                          {user?.role === 'super_admin' && u.id !== 'usr_superadmin' ? (
                            <select
                              value={u.role}
                              onChange={(e) => handleUpdateRole(u.id, e.target.value as any)}
                              className="bg-slate-900 border border-slate-850 text-white rounded px-2 py-1 text-[10px] uppercase font-bold focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                            >
                              <option value="user">Student (User)</option>
                              <option value="admin">Instructor (Admin)</option>
                              <option value="super_admin">Director (Super Admin)</option>
                            </select>
                          ) : (
                            <span className={`px-2 py-0.5 rounded-full border text-[9px] uppercase font-bold ${
                              u.role === 'super_admin'
                                ? 'bg-amber-950/40 border-amber-900/50 text-amber-400'
                                : u.role === 'admin'
                                ? 'bg-rose-950/40 border-rose-900/50 text-rose-400'
                                : 'bg-indigo-950/40 border-indigo-900/50 text-indigo-300'
                            }`}>
                              {u.role === 'super_admin' ? 'Super Admin' : u.role}
                            </span>
                          )}
                        </td>

                        {/* Subscription Tier dropdown */}
                        <td className="p-4">
                          {u.id === 'usr_superadmin' || u.id === 'usr_admin' ? (
                            <span className="text-[10px] bg-indigo-950 border border-indigo-900 text-indigo-400 uppercase font-bold px-2 py-0.5 rounded">
                              PRO BYPASS
                            </span>
                          ) : (
                            <select
                              value={u.plan || 'free'}
                              onChange={(e) => handleUpdatePlan(u.id, e.target.value as any)}
                              className="bg-slate-940 bg-slate-900 border border-slate-800 text-white rounded px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider focus:outline-none focus:ring-1 focus:ring-indigo-550 focus:ring-indigo-500 cursor-pointer"
                            >
                              <option value="free" className="text-slate-400 font-sans">Free Tier</option>
                              <option value="basic" className="text-indigo-400 font-sans">Basic Tier</option>
                              <option value="pro" className="text-amber-400 font-sans">Pro Scholar</option>
                            </select>
                          )}
                        </td>

                        {/* Daily Limit Tracker */}
                        <td className="p-4 align-middle">
                          {u.role === 'admin' || u.role === 'super_admin' ? (
                            <span className="text-slate-500 font-mono">Bypassed</span>
                          ) : (
                            <div className="flex items-center space-x-2">
                              {/* inline quota input for fast updates */}
                              <input
                                type="number"
                                min="0"
                                value={quotaInputs[u.id] || '0'}
                                onChange={(e) => handleUpdateQuotaInputChange(u.id, e.target.value)}
                                className="w-14 px-2 py-1 bg-slate-850 border border-slate-700 rounded-lg text-center font-mono font-bold text-[10px] text-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                              <button
                                onClick={() => handleSaveQuota(u.id)}
                                className="text-[10px] bg-indigo-950 hover:bg-indigo-900 border border-indigo-900 text-indigo-300 font-bold px-2 py-1 rounded-lg transition"
                                title="Overwrite Daily Usage Count"
                              >
                                Save
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Joined timestamp */}
                        <td className="p-4 font-mono text-[10px] text-slate-450">
                          <div className="flex items-center space-x-1 text-slate-400">
                            <Calendar className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                            <span>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Trial'}</span>
                          </div>
                        </td>

                        {/* Actions block */}
                        <td className="p-4 th-actions text-right font-sans">
                          <div className="flex items-center justify-end gap-2">
                            {/* Verification manual toggles */}
                            {u.id !== 'usr_superadmin' && (
                              <button
                                onClick={() => handleUpdateVerification(u.id, !!u.isVerified)}
                                className={`inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wide transition cursor-pointer border ${
                                  u.isVerified
                                    ? 'bg-amber-950/20 border-amber-900/50 text-amber-450 text-amber-400 hover:bg-amber-950/40'
                                    : 'bg-emerald-950/20 border-emerald-900/50 text-emerald-450 text-emerald-400 hover:bg-emerald-950/40'
                                }`}
                                title={u.isVerified ? "De-Authorize Student Verification" : "Force Accept Verification check"}
                              >
                                {u.isVerified ? (
                                  <>
                                    <ShieldAlert className="w-3 h-3 text-amber-500 shrink-0" />
                                    <span>UNVERIFY</span>
                                  </>
                                ) : (
                                  <>
                                    <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                                    <span>FORCE-VERIFY</span>
                                  </>
                                )}
                              </button>
                            )}

                            {/* Ban/Unban Actions */}
                            {u.id === 'usr_superadmin' ? (
                              <span className="text-slate-500 font-mono text-[10px]">Owner Protected</span>
                            ) : (u.role === 'admin' || u.role === 'super_admin') && user?.role !== 'super_admin' ? (
                              <span className="text-slate-500 font-mono text-[10px]">Protected profile</span>
                            ) : (
                              <button
                                onClick={() => handleToggleBan(u.id)}
                                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wide transition cursor-pointer border ${
                                  u.isBanned
                                    ? 'bg-emerald-950/25 border-emerald-900/50 text-emerald-400 hover:bg-emerald-950/45'
                                    : 'bg-rose-950/25 border-rose-900/50 text-rose-400 hover:bg-rose-950/45'
                                }`}
                              >
                                {u.isBanned ? (
                                  <>
                                    <Unlock className="w-3 h-3 shrink-0" />
                                    <span>UNBAN</span>
                                  </>
                                ) : (
                                  <>
                                    <Ban className="w-3 h-3 shrink-0" />
                                    <span>SUSPEND</span>
                                  </>
                                )}
                              </button>
                            )}

                            {/* Purge Account Action */}
                            {u.id !== 'usr_superadmin' && (user?.role === 'super_admin' || u.role === 'user') && (
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wide transition cursor-pointer border bg-red-950/25 border-red-900/55 text-red-400 hover:bg-red-950/45"
                                title="Purge Profile"
                              >
                                <Trash className="w-3 h-3 shrink-0" />
                                <span>PURGE</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

      </main>
    </div>
  );
};
export default AdminUsers;
