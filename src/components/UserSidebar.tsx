import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOfflineSync } from '../context/OfflineSyncContext';
import {
  GraduationCap,
  MessageSquare,
  BookOpen,
  History,
  User,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Wifi,
  WifiOff,
  Cloud,
  LogOut
} from 'lucide-react';

export const UserSidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { isOnline, syncQueue } = useOfflineSync();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load preferences
  useEffect(() => {
    const saved = localStorage.getItem('studynet_sidebar_collapsed');
    if (saved) {
      setIsCollapsed(saved === 'true');
    }
  }, []);

  // Hide on login and register pages
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  const toggleSidebar = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem('studynet_sidebar_collapsed', String(nextState));
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const menuItems = [
    {
      title: 'Academy Hub',
      path: '/',
      icon: GraduationCap,
      color: 'text-indigo-400'
    },
    {
      title: 'AI Companion',
      path: '/chat',
      icon: MessageSquare,
      color: 'text-purple-400'
    },
    {
      title: 'Books Library',
      path: '/library',
      icon: BookOpen,
      color: 'text-teal-400'
    },
    {
      title: 'Study Journals',
      path: '/history',
      icon: History,
      color: 'text-amber-400'
    },
    {
      title: 'Campus Profile',
      path: '/profile',
      icon: User,
      color: 'text-pink-400'
    }
  ];

  // If user is not authenticated, we only show Home & Library
  const filteredMenuItems = user ? menuItems : menuItems.slice(0, 3).filter(item => item.path !== '/chat' && item.path !== '/history');

  return (
    <aside
      className={`hidden md:flex flex-col bg-slate-950/90 border-r border-slate-900/80 text-slate-300 transition-all duration-300 relative select-none shrink-0 min-h-[calc(100vh-64px)] ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand area if wanted, otherwise stick to simple elegant spacing */}
      <div className="p-5 flex items-center justify-between border-b border-slate-900/60">
        {!isCollapsed ? (
          <div className="flex items-center space-x-2 animate-fade-in">
            <GraduationCap className="h-6 w-6 text-indigo-500" />
            <span className="font-extrabold text-sm tracking-wider text-white">STUDYNAV</span>
          </div>
        ) : (
          <div className="mx-auto">
            <GraduationCap className="h-6 w-6 text-indigo-500 animate-pulse" />
          </div>
        )}

        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/30 text-slate-400 hover:text-white hover:bg-slate-900 transition focus:outline-none cursor-pointer"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-2">
        {filteredMenuItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center h-11 rounded-xl transition duration-200 group text-xs font-bold uppercase tracking-wide cursor-pointer ${
                active
                  ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.06)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent'
              } ${isCollapsed ? 'justify-center px-0' : 'px-4 gap-3.5'}`}
              title={isCollapsed ? item.title : undefined}
            >
              <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 duration-200 ${active ? 'text-indigo-400' : 'text-slate-500'}`} />
              {!isCollapsed && <span className="truncate">{item.title}</span>}
              {!isCollapsed && active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#4f46e5]" />
              )}
            </Link>
          );
        })}

        {/* Admin Switcher */}
        {user && (user.role === 'admin' || user.role === 'super_admin') && (
          <Link
            to="/admin/dashboard"
            className={`flex items-center h-11 rounded-xl transition duration-200 group text-xs font-bold uppercase tracking-wide cursor-pointer text-rose-400 hover:bg-rose-550/10 hover:text-rose-300 border border-transparent ${
              isCollapsed ? 'justify-center px-0' : 'px-4 gap-3.5'
            }`}
            title="Faculty Controller"
          >
            <ShieldCheck className="w-4 h-4 text-rose-500 shrink-0" />
            {!isCollapsed && <span className="truncate">Admin Control</span>}
          </Link>
        )}
      </nav>

      {/* Connection Mode Footer Info */}
      <div className="p-4 border-t border-slate-900/60 bg-slate-950/40">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} text-[10px] font-mono`}>
          {!isCollapsed && (
            <div className="flex flex-col gap-0.5">
              <span className="text-slate-500">Connection Mode</span>
              <span className={`font-bold uppercase ${isOnline ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            {syncQueue.length > 0 && !isCollapsed && (
              <div 
                className="bg-amber-600/25 border border-amber-500/20 px-2 py-0.5 rounded text-[9px] text-amber-400 animate-pulse font-sans font-extrabold uppercase tracking-widest mr-2"
                title={`${syncQueue.length} items queued`}
              >
                {syncQueue.length} Syncing
              </div>
            )}

            {isOnline ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-rose-500 shrink-0 animate-pulse" />
            )}
          </div>
        </div>

        {/* Collapsed logout capability */}
        {user && !isCollapsed && (
          <button
            onClick={logout}
            className="mt-4 w-full flex items-center justify-between text-left p-2 rounded-xl text-xs font-bold font-sans text-slate-500 hover:text-rose-400 hover:bg-rose-950/10 transition cursor-pointer"
          >
            <span>Log Out</span>
            <LogOut className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </aside>
  );
};

export default UserSidebar;
