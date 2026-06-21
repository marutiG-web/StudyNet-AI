import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquare, Settings, ShieldAlert, GraduationCap, FileText } from 'lucide-react';

export const AdminSidebar: React.FC = () => {
  const location = useLocation();

  const menuItems = [
    {
      title: 'Console Dashboard',
      path: '/admin/dashboard',
      icon: LayoutDashboard,
      color: 'text-indigo-500'
    },
    {
      title: 'Govern Students',
      path: '/admin/users',
      icon: Users,
      color: 'text-violet-500'
    },
    {
      title: 'Build Pages & Media',
      path: '/admin/pages',
      icon: FileText,
      color: 'text-teal-500'
    },
    {
      title: 'Audit Chat Logs',
      path: '/admin/chats',
      icon: MessageSquare,
      color: 'text-emerald-500'
    },
    {
      title: 'Instruct AI Prompts',
      path: '/admin/settings',
      icon: Settings,
      color: 'text-amber-500'
    }
  ];

  return (
    <aside className="w-full md:w-64 bg-slate-900 shrink-0 min-h-0 md:min-h-[calc(100vh-65px)] flex flex-col border-b md:border-b-0 md:border-r border-slate-800 text-slate-300">
      
      {/* Title block - hidden on mobile for extreme spatial efficiency */}
      <div className="hidden md:block p-6 border-b border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <ShieldAlert className="w-5 h-5 text-rose-500 animate-pulse shrink-0" />
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Command System</div>
            <div className="text-sm font-extrabold text-white">Faculty Controller</div>
          </div>
        </div>
      </div>

      {/* Navigation rows - horizontal grid scrolling on mobile */}
      <nav className="flex flex-row md:flex-col p-3 md:p-4 gap-2 md:space-y-1.5 overflow-x-auto md:overflow-x-visible select-none scrollbar-none scroll-smooth">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-2 px-3.5 py-2.5 md:px-4 md:py-3 rounded-xl text-[10px] md:text-xs font-bold tracking-wide uppercase transition shrink-0 ${
                isActive
                  ? 'bg-slate-800 text-white shadow-inner border border-slate-700/50'
                  : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-100'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
              <span>{item.title.replace('Console ', '').replace('Govern ', '').replace('Audit ', '').replace('Instruct ', '')}</span>
            </Link>
          );
        })}
      </nav>

      {/* Faculty details - hidden on mobile */}
      <div className="hidden md:flex p-4 border-t border-slate-850 bg-slate-950/40 text-[10px] font-mono items-center justify-between text-slate-505 text-slate-500">
        <span>SSL Server Active</span>
        <span>Secure Session</span>
      </div>
    </aside>
  );
};
export default AdminSidebar;
