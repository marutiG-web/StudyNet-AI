import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import AdminSidebar from '../components/AdminSidebar';
import { CustomPage, MediaItem, NavigationMenu } from '../types';
import { 
  FileText, Image, File, Plus, Edit, Trash, Copy, Check, 
  Eye, EyeOff, Upload, Globe, RotateCw, Loader2, ArrowUpRight, 
  Search, ExternalLink, Calendar, HardDrive, Lock
} from 'lucide-react';

export const AdminPages: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'pages' | 'media' | 'menus'>('pages');

  // Loading & Error States
  const [loadingPages, setLoadingPages] = useState(true);
  const [loadingMedia, setLoadingMedia] = useState(true);
  const [loadingMenus, setLoadingMenus] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Core Data Lists
  const [pages, setPages] = useState<CustomPage[]>([]);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [menus, setMenus] = useState<NavigationMenu[]>([]);

  // Search/Filters
  const [pageSearch, setPageSearch] = useState('');
  const [mediaSearch, setMediaSearch] = useState('');

  // Active Editors / Selected entities
  const [editingPage, setEditingPage] = useState<Partial<CustomPage> | null>(null);
  const [editingMenu, setEditingMenu] = useState<Partial<NavigationMenu> | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Drag and Drop State
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      navigate('/admin/login');
      return;
    }
    loadPages();
    loadMedia();
    loadMenus();
  }, [user]);

  const loadMenus = async () => {
    try {
      setLoadingMenus(true);
      const res = await api.getNavigationMenus();
      if (res.success && res.menus) {
        setMenus(res.menus);
      }
    } catch (e: any) {
      console.error('Failed to sync menus:', e);
    } finally {
      setLoadingMenus(false);
    }
  };

  const loadPages = async () => {
    try {
      setLoadingPages(true);
      setError(null);
      const res = await api.getPages(); // Admin variant returns all pages
      if (res.success && res.pages) {
        setPages(res.pages);
      } else {
        setError(res.error || 'Failed to sync content pages.');
      }
    } catch (e: any) {
      setError(e.message || 'Page management server is offline.');
    } finally {
      setLoadingPages(false);
    }
  };

  const loadMedia = async () => {
    try {
      setLoadingMedia(true);
      setError(null);
      const res = await api.adminGetMedia();
      if (res.success && res.media) {
        setMediaList(res.media);
      } else {
        setError(res.error || 'Failed to sync media library.');
      }
    } catch (e: any) {
      setError(e.message || 'Media storage server is offline.');
    } finally {
      setLoadingMedia(false);
    }
  };

  // Helper trigger notifying results
  const showNote = (type: 'success' | 'error', msg: string) => {
    setNotification({ type, message: msg });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // --- PAGES CRUD ---
  const handleStartCreatePage = () => {
    if (user?.role !== 'super_admin') {
      showNote('error', 'Strict Permissions: Only the Super Administrator is permitted to create custom pages.');
      return;
    }
    setEditingMenu(null);
    setEditingPage({
      id: '',
      title: '',
      slug: '',
      content: '',
      visible: true,
      isHtml: false
    });
  };

  const handleTitleChangeForSlug = (titleVal: string) => {
    if (!editingPage) return;
    const isNew = !editingPage.id;
    
    // Auto generate slug if creating a new page and the slug was empty or matching target slug
    let updatedSlug = editingPage.slug || '';
    if (isNew) {
      updatedSlug = titleVal
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');
    }

    setEditingPage({
      ...editingPage,
      title: titleVal,
      slug: updatedSlug
    });
  };

  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPage) return;

    const { id, title, slug, content, visible, isHtml } = editingPage;
    if (!title || !slug || content === undefined) {
      showNote('error', 'All page attributes must be entered.');
      return;
    }

    setActionLoading(true);
    try {
      if (id) {
        // Edit page (any admin/super_admin is allowed to edit pages)
        const res = await api.adminUpdatePage(id, { title, slug, content, visible, isHtml: !!isHtml });
        if (res.success) {
          showNote('success', `Page "${title}" updated successfully!`);
          setEditingPage(null);
          loadPages();
        } else {
          showNote('error', res.error || 'Failed to update page.');
        }
      } else {
        // Create page (only super_admin)
        if (user?.role !== 'super_admin') {
          showNote('error', 'Permissions Refused: Only the Super Administrator is allowed to compile custom pages.');
          setActionLoading(false);
          return;
        }
        const res = await api.adminCreatePage({ title, slug, content, visible: visible !== false, isHtml: !!isHtml });
        if (res.success) {
          showNote('success', `Page "${title}" successfully integrated!`);
          setEditingPage(null);
          loadPages();
        } else {
          showNote('error', res.error || 'Failed to compile new page.');
        }
      }
    } catch (err: any) {
      showNote('error', err.message || 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePage = async (id: string, name: string) => {
    if (user?.role !== 'super_admin') {
      showNote('error', 'Permissions Refused: Only the Super Administrator is permitted to delete custom pages.');
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete custom page "${name}"?`)) return;
    try {
      setActionLoading(true);
      const res = await api.adminDeletePage(id);
      if (res.success) {
        showNote('success', 'Page successfully excluded.');
        if (editingPage?.id === id) setEditingPage(null);
        loadPages();
      } else {
        showNote('error', res.error || 'Failed to purge page.');
      }
    } catch (e: any) {
      showNote('error', e.message || 'Failed to send delete request.');
    } finally {
      setActionLoading(false);
    }
  };

  // --- NAVIGATION MENUS CRUD (All admins) ---
  const handleStartCreateMenu = () => {
    setEditingPage(null);
    setEditingMenu({
      id: '',
      label: '',
      link: '',
      order: 0,
      parentId: ''
    });
  };

  const handleSaveMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMenu) return;

    const { id, label, link, order, parentId } = editingMenu;
    if (!label || !link) {
      showNote('error', 'Menu label and target destination link are required.');
      return;
    }

    setActionLoading(true);
    try {
      if (id) {
        const res = await api.adminUpdateNavigationMenu(id, {
          label,
          link,
          order: Number(order) || 0,
          parentId: parentId || undefined
        });
        if (res.success) {
          showNote('success', `Navigation link "${label}" updated successfully!`);
          setEditingMenu(null);
          loadMenus();
        } else {
          showNote('error', res.error || 'Failed to update menu.');
        }
      } else {
        const res = await api.adminCreateNavigationMenu({
          label,
          link,
          order: Number(order) || 0,
          parentId: parentId || undefined
        });
        if (res.success) {
          showNote('success', `Navigation link "${label}" created successfully!`);
          setEditingMenu(null);
          loadMenus();
        } else {
          showNote('error', res.error || 'Failed to establish menu.');
        }
      }
    } catch (err: any) {
      showNote('error', err.message || 'Operation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteMenu = async (id: string, label: string) => {
    if (!window.confirm(`Are you sure you want to delete menu link "${label}"? This will also remove any submenus nested under it.`)) return;
    try {
      setActionLoading(true);
      const res = await api.adminDeleteNavigationMenu(id);
      if (res.success) {
        showNote('success', 'Navigation menu item successfully removed.');
        if (editingMenu?.id === id) setEditingMenu(null);
        loadMenus();
      } else {
        showNote('error', res.error || 'Failed to delete menu.');
      }
    } catch (e: any) {
      showNote('error', e.message || 'Operation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // --- MEDIA FILE UPLOADS ---
  const handleFileUpload = (file: File) => {
    if (file.size > 14 * 1024 * 1024) {
      showNote('error', 'Strict limits: file must be under 14MB.');
      return;
    }

    setActionLoading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64Content = reader.result as string;
      try {
        const res = await api.adminAddMedia({
          name: file.name,
          type: file.type,
          size: file.size,
          base64: base64Content
        });

        if (res.success) {
          showNote('success', `File "${file.name}" uploaded successfully!`);
          loadMedia();
        } else {
          showNote('error', res.error || 'Media allocation refused.');
        }
      } catch (err: any) {
        showNote('error', err.message || 'Backend rejected upload.');
      } finally {
        setActionLoading(false);
      }
    };
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleDeleteMedia = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete media asset "${name}"?`)) return;
    try {
      setActionLoading(true);
      const res = await api.adminDeleteMedia(id);
      if (res.success) {
        showNote('success', 'File asset purged from media cloud.');
        loadMedia();
      } else {
        showNote('error', res.error || 'Failed to exclude asset.');
      }
    } catch (e: any) {
      showNote('error', e.message || 'Media deletion request failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const copyMediaURL = (id: string) => {
    const directUrl = `${window.location.origin}/api/media/${id}`;
    navigator.clipboard.writeText(directUrl);
    setCopiedId(id);
    showNote('success', 'Link copied! Use this link inside your study layout tools.');
    setTimeout(() => setCopiedId(null), 3000);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const filteredPages = pages.filter(p => 
    p.title.toLowerCase().includes(pageSearch.toLowerCase()) || 
    p.slug.toLowerCase().includes(pageSearch.toLowerCase()) ||
    p.content.toLowerCase().includes(pageSearch.toLowerCase())
  );

  const filteredMedia = mediaList.filter(m => 
    m.name.toLowerCase().includes(mediaSearch.toLowerCase()) ||
    m.type.toLowerCase().includes(mediaSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col md:flex-row">
      {/* Faculty Administration Navigation Sidebar */}
      <AdminSidebar />

      {/* Main Panel Content area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-900/80 mb-6 gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-1.5">
              <Globe className="w-4 h-4 animate-spin-slow text-indigo-500" />
              <span>DYNAMIC SITE BUILDER</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Pages & Media Manager
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Construct student pages online instantly and upload custom media assets (PDFs, Images, and Syllabus guidelines) to map anywhere on your platform.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => { loadPages(); loadMedia(); loadMenus(); }}
              className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 text-slate-400 hover:text-white transition cursor-pointer"
              title="Sync Data"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            {user?.role === 'super_admin' ? (
              <button
                onClick={handleStartCreatePage}
                className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-indigo-950/45 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Page</span>
              </button>
            ) : (
              <div className="text-[10px] font-bold text-slate-400 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl flex items-center space-x-1">
                <Lock className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                <span>Super Admin Locked</span>
              </div>
            )}
          </div>
        </header>

        {/* Global Notifications popup */}
        {notification && (
          <div className={`fixed bottom-6 right-6 z-50 flex items-center space-x-3 p-4 rounded-xl shadow-2xl transition-all duration-300 animate-slide-in border ${
            notification.type === 'success' 
              ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-300 shadow-emerald-950/20' 
              : 'bg-rose-950/90 border-rose-500/30 text-rose-300 shadow-rose-950/20'
          }`}>
            <span className="text-xs font-bold tracking-wide">{notification.message}</span>
          </div>
        )}

        {/* Outer Grid split: content side & active editing form side */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left panel or content columns (takes 7 cols on lg screens if editor is open, otherwise full 12 cols) */}
          <div className={`${(editingPage || editingMenu) ? 'lg:col-span-6' : 'lg:col-span-12'} space-y-6 transition-all duration-300`}>
            
            {/* View tabs selection */}
            <div className="flex border-b border-slate-900/80 gap-3">
              <button
                onClick={() => { setActiveTab('pages'); setEditingMenu(null); }}
                className={`py-3 px-1.5 text-xs font-black tracking-wider uppercase border-b-2 transition cursor-pointer ${
                  activeTab === 'pages'
                    ? 'border-indigo-500 text-white'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Custom Pages
              </button>
              <button
                onClick={() => { setActiveTab('media'); setEditingPage(null); setEditingMenu(null); }}
                className={`py-3 px-1.5 text-xs font-black tracking-wider uppercase border-b-2 transition cursor-pointer ${
                  activeTab === 'media'
                    ? 'border-indigo-500 text-white'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Media Library
              </button>
              <button
                onClick={() => { setActiveTab('menus'); setEditingPage(null); }}
                className={`py-3 px-1.5 text-xs font-black tracking-wider uppercase border-b-2 transition cursor-pointer ${
                  activeTab === 'menus'
                    ? 'border-indigo-500 text-white'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                🚨 Dyn Navigation Menus
              </button>
            </div>

            {/* TAB CONTENT: PAGES */}
            {activeTab === 'pages' && (
              <div className="space-y-4">
                {/* Search controller */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search custom pages..."
                    value={pageSearch}
                    onChange={(e) => setPageSearch(e.target.value)}
                    className="w-full bg-slate-900/40 border border-slate-850 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium placeholder-slate-500 text-slate-100 focus:outline-none focus:border-indigo-505 transition"
                  />
                </div>

                {loadingPages ? (
                  <div className="bg-slate-900/45 border border-slate-900 rounded-2xl p-12 text-center text-slate-500">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-2" />
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading Portals...</span>
                  </div>
                ) : filteredPages.length === 0 ? (
                  <div className="bg-slate-900/45 border border-slate-900 rounded-2xl p-12 text-center text-slate-500">
                    <FileText className="w-10 h-10 mx-auto text-slate-750 text-slate-600 mb-2" />
                    <div className="text-sm font-bold text-slate-400">No Pages Registered</div>
                    <p className="text-xs text-slate-500 mt-1">Start by clicking "Create Page" above to publish information.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredPages.map((page) => (
                      <div 
                        key={page.id}
                        className={`bg-slate-900/40 border transition rounded-2xl p-5 hover:border-slate-800 ${
                          editingPage?.id === page.id ? 'border-indigo-500/30 bg-slate-900/80 shadow-[0_0_20px_rgba(99,102,241,0.05)]' : 'border-slate-900/80'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[9px] font-bold tracking-wider font-mono uppercase bg-slate-950/60 text-slate-400">
                              {page.visible ? (
                                <span className="flex items-center text-emerald-400">
                                  <Eye className="w-3 h-3 mr-1" />
                                  Published
                                </span>
                              ) : (
                                <span className="flex items-center text-amber-500">
                                  <EyeOff className="w-3 h-3 mr-1" />
                                  Offline draft
                                </span>
                              )}
                            </span>
                            <h3 className="text-sm font-extrabold text-white tracking-tight pt-1">
                              {page.title}
                            </h3>
                            <div className="text-[11px] text-indigo-400 font-mono flex items-center space-x-1">
                              <Globe className="w-3 h-3" />
                              <span>/p/{page.slug}</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => {
                                const directUrl = `${window.location.origin}/p/${page.slug}`;
                                window.open(directUrl, '_blank');
                              }}
                              className="p-1 px-1.5 rounded-lg bg-slate-950/80 hover:bg-indigo-950/40 text-slate-400 hover:text-indigo-400 border border-slate-850/60 transition cursor-pointer"
                              title="Visit Page"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingPage(page)}
                              className="p-1 px-1.5 rounded-lg bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-850/60 transition cursor-pointer"
                              title="Edit Page"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            {user?.role === 'super_admin' && (
                              <button
                                onClick={() => handleDeletePage(page.id, page.title)}
                                className="p-1 px-1.5 rounded-lg bg-slate-950/85 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-850/60 transition cursor-pointer"
                                title="Purge"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-4e text-slate-400 line-clamp-2 mt-3 block">
                          {page.content ? page.content.substring(0, 150) : 'Blank content...'}
                        </p>

                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mt-4 pt-3 border-t border-slate-850/40">
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(page.createdAt).toLocaleDateString()}
                          </span>
                          <span className="text-slate-600">ID: {page.id}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: MEDIA STORAGE */}
            {activeTab === 'media' && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Drag and Drop Zone Container */}
                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition ${
                    dragActive 
                      ? 'border-indigo-500 bg-indigo-550/10' 
                      : 'border-slate-850 bg-slate-900/20 hover:border-slate-750'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileInputChange}
                    className="hidden"
                    accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain"
                  />
                  
                  <HardDrive className="w-10 h-10 text-indigo-500 mx-auto mb-3 animate-bounce-slow" />
                  <div className="text-sm font-bold text-white">Drag & Drop file asset here</div>
                  <p className="text-xs text-slate-505 mt-1 text-slate-400">
                    Supports Images, Homework PDFs, slides, and study notes up to 14MB.
                  </p>
                  
                  <div className="mt-4">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition border border-slate-800 cursor-pointer"
                    >
                      Browse Local Drive
                    </button>
                  </div>
                </div>

                {/* Media Search bar */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search media files by name/type..."
                    value={mediaSearch}
                    onChange={(e) => setMediaSearch(e.target.value)}
                    className="w-full bg-slate-900/40 border border-slate-850 rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium placeholder-slate-500 text-slate-100 focus:outline-none focus:border-indigo-505 transition"
                  />
                </div>

                {loadingMedia ? (
                  <div className="bg-slate-900/45 border border-slate-900 rounded-2xl p-12 text-center text-slate-500">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-2" />
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading Assets...</span>
                  </div>
                ) : filteredMedia.length === 0 ? (
                  <div className="bg-slate-900/45 border border-slate-900 rounded-2xl p-12 text-center text-slate-500">
                    <Image className="w-10 h-10 mx-auto text-slate-750 text-slate-600 mb-2" />
                    <div className="text-sm font-bold text-slate-400">Media Library Empty</div>
                    <p className="text-xs text-slate-505 text-slate-400 mt-1">Upload files to copy direct web URLs and target anywhere.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredMedia.map((media) => {
                      const isImage = media.type && media.type.startsWith('image/');
                      return (
                        <div 
                          key={media.id} 
                          className="bg-slate-900/35 border border-slate-900/80 rounded-2xl overflow-hidden flex flex-col hover:border-slate-850 transition"
                        >
                          {/* Top thumbnail representation */}
                          <div className="h-28 bg-slate-950/60 relative flex items-center justify-center border-b border-slate-900/50">
                            {isImage ? (
                              <img 
                                src={media.base64} 
                                alt={media.name}
                                className="w-full h-full object-cover opacity-80"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="text-center p-4">
                                <File className="w-8 h-8 text-indigo-400 mx-auto mb-1" />
                                <span className="text-[10px] uppercase font-mono bg-indigo-500/15 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/10">
                                  {media.type ? media.type.split('/')[1] : 'FILE'}
                                </span>
                              </div>
                            )}

                            {/* Direct visualizer popup overlay */}
                            <div className="absolute top-2 right-2 flex items-center space-x-1.5">
                              <button
                                onClick={() => copyMediaURL(media.id)}
                                className="p-1.5 bg-slate-950/90 hover:bg-slate-900 text-slate-400 hover:text-white rounded-lg border border-slate-850/60 transition cursor-pointer"
                                title="Copy direct public URL"
                              >
                                {copiedId === media.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => {
                                  const directUrl = `/api/media/${media.id}`;
                                  window.open(directUrl, '_blank');
                                }}
                                className="p-1.5 bg-slate-950/90 hover:bg-slate-900 text-slate-400 hover:text-white rounded-lg border border-slate-850/60 transition cursor-pointer"
                                title="View Binary"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Details metadata block */}
                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <div className="mb-2">
                              <div className="text-xs font-extrabold text-white truncate" title={media.name}>
                                {media.name}
                              </div>
                              <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono mt-1">
                                <span>{formatBytes(media.size)}</span>
                                <span>•</span>
                                <span>{new Date(media.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>

                            <button
                              onClick={() => handleDeleteMedia(media.id, media.name)}
                              className="w-full mt-2 py-1.5 border border-rose-500/15 hover:border-rose-500/30 bg-rose-950/10 hover:bg-rose-950/40 text-[10px] font-bold text-rose-400 uppercase tracking-widest rounded-xl transition cursor-pointer flex items-center justify-center space-x-1"
                            >
                              <Trash className="w-3.5 h-3.5" />
                              <span>Purge Asset</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            )}

            {/* TAB CONTENT: NAVIGATION MENUS */}
            {activeTab === 'menus' && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-extrabold text-white">Dynamic Navigation Builder</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Customize headers, links, and sub-menu nesting. Standard admins can arrange and publish menus.</div>
                    </div>
                    <button
                      onClick={handleStartCreateMenu}
                      className="flex items-center space-x-1 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold rounded-xl border border-rose-500/25 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Menu Link</span>
                    </button>
                  </div>

                  {loadingMenus ? (
                    <div className="p-8 text-center text-slate-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-500 mb-2" />
                      <span className="text-xs font-bold font-mono">Syncing Menu Tree...</span>
                    </div>
                  ) : menus.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 border border-dashed border-slate-850 rounded-2xl text-xs font-medium">
                      No customized dynamic navigation menus created yet. Start adding items above!
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Root Menus */}
                      {menus.filter(m => !m.parentId).sort((a,b) => (a.order || 0) - (b.order || 0)).map(rootMenu => {
                        const childMenus = menus.filter(m => m.parentId === rootMenu.id).sort((a,b) => (a.order || 0) - (b.order || 0));
                        return (
                          <div key={rootMenu.id} className="bg-slate-950/65 border border-slate-850/60 rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs font-black text-white">{rootMenu.label}</span>
                                  <span className="text-[8px] font-mono font-black uppercase text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/15">Root Tab</span>
                                  <span className="text-[9px] font-mono text-slate-500">Order: {rootMenu.order || 0}</span>
                                </div>
                                <div className="text-[10px] font-mono text-slate-400">Destination URL: {rootMenu.link}</div>
                              </div>
                              <div className="flex items-center space-x-1.5">
                                <button
                                  onClick={() => setEditingMenu(rootMenu)}
                                  className="p-1 px-2 rounded-lg bg-slate-900 hover:bg-slate-850 text-xs font-bold text-slate-300 hover:text-white transition cursor-pointer"
                                  title="Edit Menu"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteMenu(rootMenu.id, rootMenu.label)}
                                  className="p-1 px-2 rounded-lg bg-rose-950/20 hover:bg-rose-950/40 text-xs font-bold text-rose-400 transition cursor-pointer"
                                  title="Remove"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>

                            {/* Submenus */}
                            {childMenus.length > 0 && (
                              <div className="pl-6 border-l border-slate-850 space-y-2 mt-2">
                                {childMenus.map(sub => (
                                  <div key={sub.id} className="bg-slate-900/40 hover:bg-slate-900/60 border border-slate-850/30 rounded-lg p-2.5 flex items-center justify-between transition">
                                    <div>
                                      <div className="flex items-center space-x-2">
                                        <span className="text-[11px] font-bold text-slate-200">↳ {sub.label}</span>
                                        <span className="text-[9px] font-mono text-slate-500">Submenu • Order: {sub.order || 0}</span>
                                      </div>
                                      <div className="text-[9px] font-mono text-slate-400">Destination: {sub.link}</div>
                                    </div>
                                    <div className="flex items-center space-x-1.5">
                                      <button
                                        onClick={() => setEditingMenu(sub)}
                                        className="p-1 px-2 rounded-md bg-slate-950/60 hover:bg-slate-800 text-[10px] font-bold text-slate-300 hover:text-white transition cursor-pointer"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleDeleteMenu(sub.id, sub.label)}
                                        className="p-1 px-2 rounded-md bg-rose-950/20 hover:bg-rose-950/45 text-[10px] font-bold text-rose-350 transition cursor-pointer"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Right Panel: Page Creation or Editing Form Panel (only rendered when editingPage is open) */}
          {editingPage && (
            <div className="lg:col-span-6 bg-slate-900/40 border border-slate-900 rounded-2xl p-6 space-y-6 self-start tracking-tight animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-850/40">
                <div className="flex items-center space-x-2.5">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  <div>
                    <h2 className="text-sm font-extrabold text-white">
                      {editingPage.id ? 'Edit Custom Page' : 'New Custom Page'}
                    </h2>
                    <p className="text-[10px] text-slate-400">
                      Assemble the student portal below
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setEditingPage(null)}
                  className="p-1 px-2.5 rounded-lg border border-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSavePage} className="space-y-4">
                {/* Title */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Page Name / Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Terms of Academic Integrity, Course Syllabus"
                    value={editingPage.title || ''}
                    onChange={(e) => handleTitleChangeForSlug(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:border-indigo-505 text-white transition"
                  />
                </div>

                {/* Slug path */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Route Slug Path
                  </label>
                  <div className="flex">
                    <span className="flex items-center px-3 bg-slate-950/80 border border-r-0 border-slate-850 rounded-l-xl text-slate-400 font-mono text-[11px]">
                      /p/
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="terms-and-faqs"
                      value={editingPage.slug || ''}
                      onChange={(e) => setEditingPage({ ...editingPage, slug: e.target.value })}
                      className="flex-1 bg-slate-950 border border-slate-850 rounded-r-xl py-2 px-3 text-xs font-mono focus:outline-none focus:border-indigo-505 text-white transition"
                    />
                  </div>
                  <p className="text-[9px] text-slate-400">
                    Lowercase letters, dashes, and digits only. Unique lookup route.
                  </p>
                </div>

                {/* Visiblity toggler */}
                <div className="flex items-center justify-between bg-slate-950/55 p-3 rounded-xl border border-slate-850/50">
                  <div>
                    <div className="text-xs font-extrabold text-white">Visible to Students</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">Toggle to publish or draft internally.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={editingPage.visible !== false}
                    onChange={(e) => setEditingPage({ ...editingPage, visible: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-950 border-slate-850 cursor-pointer"
                  />
                </div>

                {/* HTML Mode toggle */}
                <div className="flex items-center justify-between bg-slate-950/55 p-3 rounded-xl border border-slate-850/50">
                  <div>
                    <div className="text-xs font-extrabold text-white">Source Code / HTML Mode</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">Renders raw HTML instead of Markdown.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!editingPage.isHtml}
                    onChange={(e) => setEditingPage({ ...editingPage, isHtml: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-950 border-slate-850 cursor-pointer"
                  />
                </div>

                {/* Markdown/HTML content container */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Page Content
                    </label>
                    <span className="text-[9px] font-mono text-indigo-400">
                      {editingPage.isHtml ? 'Supports raw HTML source code' : 'Supports standard Markdown'}
                    </span>
                  </div>
                  <textarea
                    rows={12}
                    required
                    placeholder={editingPage.isHtml ? "<!-- Raw HTML -->\n<div class='p-4 bg-slate-900 border border-slate-800 rounded-xl'>\n  <h1 class='text-indigo-400 font-bold'>Custom Page Title</h1>\n</div>" : "# Calculus Course Guidelines\n\nWelcome Class!"}
                    value={editingPage.content || ''}
                    onChange={(e) => setEditingPage({ ...editingPage, content: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2.5 px-3 text-xs font-semibold font-mono focus:outline-none focus:border-indigo-505 text-white transition resize-y"
                  />
                </div>

                {/* Actions submit button */}
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full mt-4 flex items-center justify-center space-x-2 py-2 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 disabled:opacity-50 text-white font-extrablack text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Save Page Layout</span>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Right Panel: Menu Editing Form Panel */}
          {editingMenu && (
            <div className="lg:col-span-6 bg-slate-900/40 border border-slate-900 rounded-2xl p-6 space-y-6 self-start tracking-tight animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-850/40">
                <div className="flex items-center space-x-2.5">
                  <Globe className="w-5 h-5 text-rose-500 animate-pulse" />
                  <div>
                    <h2 className="text-sm font-extrabold text-white">
                      {editingMenu.id ? 'Edit Menu Link' : 'New Menu Link'}
                    </h2>
                    <p className="text-[10px] text-slate-400">
                      Link active custom pages, media files, or remote tabs.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setEditingMenu(null)}
                  className="p-1 px-2.5 rounded-lg border border-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSaveMenu} className="space-y-4">
                {/* Menu Label/Text */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Menu Label Text
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Terms, Syllabus Docs, Our Mission"
                    value={editingMenu.label || ''}
                    onChange={(e) => setEditingMenu({ ...editingMenu, label: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:border-rose-505 text-white transition"
                  />
                </div>

                {/* Parent Menu (for Submenus) */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Parent Level (Optional)
                  </label>
                  <select
                    value={editingMenu.parentId || ''}
                    onChange={(e) => setEditingMenu({ ...editingMenu, parentId: e.target.value || undefined })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none focus:border-rose-505 text-white transition text-slate-200"
                  >
                    <option value="">-- Main Root Level (No Parent) --</option>
                    {menus.filter(m => !m.parentId && m.id !== editingMenu.id).map(root => (
                      <option key={root.id} value={root.id}>
                        {root.label} (Submenu under {root.label})
                      </option>
                    ))}
                  </select>
                  <p className="text-[9px] text-slate-400">
                    Link this menu under a root tab to render it as a drop-down.
                  </p>
                </div>

                {/* Target URL Link destination */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-405 text-slate-400">
                    Target Route / Destination link
                  </label>
                  
                  {/* Select preset list option helper */}
                  <div className="grid grid-cols-2 gap-2 pb-1.5 select-none">
                    <button
                      type="button"
                      onClick={() => setEditingMenu({ ...editingMenu, link: '/' })}
                      className="text-[9px] text-left p-1 text-slate-400 hover:text-white bg-slate-950 border border-slate-850/60 rounded cursor-pointer transition truncate"
                    >
                      Preset: Main /
                    </button>
                    {pages.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setEditingMenu({ ...editingMenu, link: `/p/${p.slug}` })}
                        className="text-[9px] text-left p-1 text-slate-400 hover:text-white bg-slate-950 border border-slate-850/60 rounded cursor-pointer transition truncate"
                        title={`Link to page: ${p.title}`}
                      >
                        Preset: {p.title}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    required
                    placeholder="e.g. /p/syllabus, /terms, or external protocol https://"
                    value={editingMenu.link || ''}
                    onChange={(e) => setEditingMenu({ ...editingMenu, link: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 px-3 text-xs font-mono focus:outline-none focus:border-rose-505 text-white transition"
                  />
                </div>

                {/* Sorting Weight */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Ordering Priority Weight
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={editingMenu.order !== undefined ? editingMenu.order : 0}
                    onChange={(e) => setEditingMenu({ ...editingMenu, order: Number(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl py-2 px-3 text-xs font-mono focus:outline-none focus:border-rose-505 text-white transition"
                  />
                  <p className="text-[9px] text-slate-400">
                    Lower numbers display first (e.g., 0, 1, 2) from left to right.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full mt-4 flex items-center justify-center space-x-2 py-2 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:opacity-90 disabled:opacity-50 text-white font-extrablack text-xs uppercase tracking-wider rounded-xl transition cursor-pointer"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Save Menu Link</span>
                  )}
                </button>
              </form>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};
export default AdminPages;
