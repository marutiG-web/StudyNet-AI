import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, LogOut, LayoutDashboard, MessageSquare, History, User, Settings, Users, Menu, X, BookOpen, Globe } from 'lucide-react';
import { api } from '../lib/api';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [pages, setPages] = useState<any[]>([]);
  const [menus, setMenus] = useState<any[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeDropdownMenuId, setActiveDropdownMenuId] = useState<string | null>(null);

  useEffect(() => {
    loadNavbarData();
  }, [user]);

  const loadNavbarData = async () => {
    try {
      const resPages = await api.getPages();
      if (resPages.success && resPages.pages) {
        setPages(resPages.pages);
      }
    } catch (e) {
      // fail silently
    }

    try {
      const resMenus = await api.getNavigationMenus();
      if (resMenus.success && resMenus.menus) {
        setMenus(resMenus.menus);
      }
    } catch (e) {
      // fail silently
    }
  };

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-slate-950/80 backdrop-blur-xl border-b border-slate-900/80 shadow-2xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center space-x-2 text-indigo-400 hover:text-indigo-305 transition group">
              <GraduationCap className="h-8 w-8 text-indigo-500 group-hover:rotate-6 transition-transform duration-300" />
              <span className="font-black text-xl tracking-wider text-white">
                StudyNet<span className="bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">.AI</span>
              </span>
            </Link>

            {/* Dynamic Custom menus - desktop only */}
            {menus.length > 0 && (
              <div className="hidden md:flex items-center space-x-2 ml-8 border-l border-slate-900 pl-6">
                {menus.filter(m => !m.parentId).sort((a,b) => (a.order || 0) - (b.order || 0)).map(root => {
                  const subitems = menus.filter(m => m.parentId === root.id).sort((a,b) => (a.order || 0) - (b.order || 0));
                  const hasSub = subitems.length > 0;
                  
                  return (
                    <div 
                      key={root.id} 
                      className="relative group"
                      onMouseEnter={() => hasSub && setActiveDropdownMenuId(root.id)}
                      onMouseLeave={() => hasSub && setActiveDropdownMenuId(null)}
                    >
                      {hasSub ? (
                        <button
                          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-900 transition-colors uppercase tracking-wider cursor-pointer"
                        >
                          <span>{root.label}</span>
                          <span className="text-[8px] opacity-70">▼</span>
                        </button>
                      ) : (
                        <Link
                          to={root.link}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-900 transition-colors uppercase tracking-wider block"
                        >
                          {root.label}
                        </Link>
                      )}

                      {hasSub && activeDropdownMenuId === root.id && (
                        <div className="absolute left-0 mt-1 w-48 bg-slate-950/95 backdrop-blur-2xl border border-slate-900 rounded-xl shadow-2xl py-1.5 z-50 animate-fade-in animate-float-tiny animate-duration-150">
                          {subitems.map(sub => (
                            <Link
                              key={sub.id}
                              to={sub.link}
                              onClick={() => setActiveDropdownMenuId(null)}
                              className="block px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900/60 transition"
                            >
                              {sub.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-1 sm:space-x-4">
            {user ? (
              <>
                {(user.role === 'admin' || user.role === 'super_admin') ? (
                  // Admin links - desktop only
                  <div className="hidden md:flex items-center space-x-2.5 mr-4">
                    <Link
                      to="/admin/dashboard"
                      className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition ${
                        isActive('/admin/dashboard')
                          ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                      }`}
                    >
                      <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                      <span>Dashboard</span>
                    </Link>
                    <Link
                      to="/library"
                      className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition ${
                        isActive('/library')
                          ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                      }`}
                    >
                      <BookOpen className="w-4 h-4 text-indigo-400" />
                      <span>Library</span>
                    </Link>
                    <Link
                      to="/admin/users"
                      className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition ${
                        isActive('/admin/users')
                          ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                      }`}
                    >
                      <Users className="w-4 h-4 text-indigo-400" />
                      <span>Students</span>
                    </Link>
                    <Link
                      to="/admin/chats"
                      className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition ${
                        isActive('/admin/chats')
                          ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4 text-indigo-400" />
                      <span>Chat Logs</span>
                    </Link>
                    <Link
                      to="/admin/settings"
                      className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition ${
                        isActive('/admin/settings')
                          ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                      }`}
                    >
                      <Settings className="w-4 h-4 text-indigo-400" />
                      <span>AI Prompts</span>
                    </Link>
                  </div>
                ) : (
                  // Regular student links - desktop only
                  <div className="hidden md:flex items-center space-x-2.5 mr-4">
                    <Link
                      to="/chat"
                      className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition ${
                        isActive('/chat')
                          ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4 text-indigo-400" />
                      <span>Tutor Chat</span>
                    </Link>
                    <Link
                      to="/library"
                      className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition ${
                        isActive('/library')
                          ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                      }`}
                    >
                      <BookOpen className="w-4 h-4 text-indigo-400" />
                      <span>Library</span>
                    </Link>
                    <Link
                      to="/history"
                      className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition ${
                        isActive('/history')
                          ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                      }`}
                    >
                      <History className="w-4 h-4 text-indigo-400" />
                      <span>Study Logs</span>
                    </Link>
                    <Link
                      to="/profile"
                      className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition ${
                        isActive('/profile')
                          ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                      }`}
                    >
                      <User className="w-4 h-4 text-indigo-400" />
                      <span>Student Card</span>
                    </Link>

                    {/* Resources Dropdown */}
                    {pages.length > 0 && (
                      <div className="relative">
                        <button
                          onClick={() => setDropdownOpen(!dropdownOpen)}
                          className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold tracking-wider uppercase text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent transition cursor-pointer"
                        >
                          <Globe className="w-4 h-4 text-indigo-400" />
                          <span>Resources</span>
                          <span className="text-[9px] opacity-70 ml-1">▼</span>
                        </button>
                        
                        {dropdownOpen && (
                          <div className="absolute right-0 mt-2 w-48 bg-slate-950/95 backdrop-blur-xl border border-slate-900 rounded-xl shadow-2xl py-1.5 z-50">
                            {pages.map((p) => (
                              <Link
                                key={p.id}
                                to={`/p/${p.slug}`}
                                onClick={() => setDropdownOpen(false)}
                                className="block px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 transition"
                              >
                                {p.title}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center space-x-2 pl-2">
                  <div className="text-right hidden sm:block mr-2">
                    <div className="text-xs font-extrabold text-white">{user.username}</div>
                    <div className="text-[9px] capitalize tracking-widest font-black mt-0.5">
                      {user.role === 'super_admin' ? (
                        <span className="text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                          SUPER ADMIN
                        </span>
                      ) : user.role === 'admin' ? (
                        <span className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                          FACULTY ADMIN
                        </span>
                      ) : (
                        <span className="text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                          STUDENT
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Mobile navigation toggle button */}
                  <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900/60 transition cursor-pointer"
                    title="Toggle System Navigation"
                  >
                    {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </button>

                  <button
                    onClick={handleLogout}
                    title="Sign Out"
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/45 transition cursor-pointer"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/library"
                  className={`hidden sm:flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-bold tracking-wider uppercase transition ${
                    isActive('/library')
                      ? 'text-indigo-400 bg-indigo-500/10'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-indigo-400 pt-0.5" />
                  <span>Library</span>
                </Link>
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl transition"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 hover:opacity-90 shadow-lg shadow-indigo-950/50 rounded-xl transition"
                >
                  Join Free
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown Panel */}
      {mobileMenuOpen && user && (
        <div className="md:hidden border-t border-slate-900 bg-slate-950/95 backdrop-blur-2xl py-3 px-4 space-y-2.5 shadow-2xl animate-fade-in animate-float-tiny">
          {/* User Brief info for small screens */}
          <div className="pb-2 border-b border-slate-900/80 sm:hidden">
            <span className="block text-xs font-extrabold text-white">{user.username}</span>
            <span className="block text-[9px] text-slate-550 font-mono tracking-wider mt-0.5 text-slate-400">
              {user.email}
            </span>
          </div>

          {(user.role === 'admin' || user.role === 'super_admin') ? (
            <div className="flex flex-col space-y-1">
              <Link
                to="/admin/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-2.5 p-3 rounded-xl text-xs font-bold tracking-wide uppercase transition ${
                  isActive('/admin/dashboard')
                    ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                <span>Console Dashboard</span>
              </Link>
              <Link
                to="/admin/users"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-2.5 p-3 rounded-xl text-xs font-bold tracking-wide uppercase transition ${
                  isActive('/admin/users')
                    ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Users className="w-4 h-4 text-indigo-400" />
                <span>Govern Students</span>
              </Link>
              <Link
                to="/admin/chats"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-2.5 p-3 rounded-xl text-xs font-bold tracking-wide uppercase transition ${
                  isActive('/admin/chats')
                    ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <span>Audit Chat Logs</span>
              </Link>
              <Link
                to="/admin/settings"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-2.5 p-3 rounded-xl text-xs font-bold tracking-wide uppercase transition ${
                  isActive('/admin/settings')
                    ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Settings className="w-4 h-4 text-indigo-400" />
                <span>Instruct AI Prompts</span>
              </Link>
              <Link
                to="/library"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-2.5 p-3 rounded-xl text-xs font-bold tracking-wide uppercase transition ${
                  isActive('/library')
                    ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>Book Library</span>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col space-y-1">
              <Link
                to="/chat"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-2.5 p-3 rounded-xl text-xs font-bold tracking-wide uppercase transition ${
                  isActive('/chat')
                    ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <span>Tutor Chat Workspace</span>
              </Link>
              <Link
                to="/history"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-2.5 p-3 rounded-xl text-xs font-bold tracking-wide uppercase transition ${
                  isActive('/history')
                    ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <History className="w-4 h-4 text-indigo-400" />
                <span>Study History Logs</span>
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-2.5 p-3 rounded-xl text-xs font-bold tracking-wide uppercase transition ${
                  isActive('/profile')
                    ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <User className="w-4 h-4 text-indigo-400" />
                <span>Student Digital Card</span>
              </Link>
              <Link
                to="/library"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-2.5 p-3 rounded-xl text-xs font-bold tracking-wide uppercase transition ${
                  isActive('/library')
                    ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>Book Library</span>
              </Link>

              {/* Dynamic Custom Menus on Mobile */}
              {menus.length > 0 ? (
                <div className="pt-2 border-t border-slate-950 mt-2 space-y-1">
                  <div className="px-3 text-[10px] font-black uppercase text-slate-500 tracking-wider mb-1">
                    Navigation Links
                  </div>
                  {menus.filter(m => !m.parentId).sort((a,b) => (a.order || 0) - (b.order || 0)).map(root => {
                    const subitems = menus.filter(m => m.parentId === root.id).sort((a,b) => (a.order || 0) - (b.order || 0));
                    return (
                      <div key={root.id} className="space-y-1">
                        <Link
                          to={root.link}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center space-x-2.5 p-2.5 rounded-xl text-xs font-bold uppercase text-slate-300 hover:text-white hover:bg-slate-900/40"
                        >
                          <Globe className="w-4 h-4 text-indigo-400" />
                          <span>{root.label}</span>
                        </Link>
                        {subitems.map(sub => (
                          <Link
                            key={sub.id}
                            to={sub.link}
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center space-x-2.5 p-2 pl-8 rounded-xl text-xs font-bold uppercase text-slate-400 hover:text-slate-200 hover:bg-slate-900/35"
                          >
                            <span>↳ {sub.label}</span>
                          </Link>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ) : (
                pages.map((p) => (
                  <Link
                    key={p.id}
                    to={`/p/${p.slug}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-2.5 p-3 rounded-xl text-xs font-bold tracking-wide uppercase transition ${
                      isActive(`/p/${p.slug}`)
                        ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/10'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <Globe className="w-4 h-4 text-indigo-400" />
                    <span>{p.title}</span>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
export default Navbar;
