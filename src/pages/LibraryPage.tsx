import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Book, Purchase } from '../types';
import SEO from '../components/SEO';
import { 
  BookOpen, Search, Filter, Compass, CheckCircle, Download, ShoppingCart, 
  Trash2, Edit, Plus, X, AlertCircle, Bookmark, Star, Calendar, User as UserIcon, LogIn, DollarSign, ListOrdered
} from 'lucide-react';

export default function LibraryPage() {
  const { user } = useAuth();
  
  // Library State
  const [books, setBooks] = useState<Book[]>([]);
  const [myBooks, setMyBooks] = useState<Book[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'store' | 'library' | 'admin'>('store');
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modal / Interaction State
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [checkingOutBook, setCheckingOutBook] = useState<Book | null>(null);
  const [checkoutCard, setCheckoutCard] = useState({
    number: '4111 2222 3333 4444',
    name: user ? user.username.toUpperCase() : 'STUDENT HOLDER',
    expiry: '12/28',
    cvv: '369'
  });
  const [processingPayment, setProcessingPayment] = useState(false);

  // Admin Form State (Add / Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    price: 0,
    description: '',
    category: 'Mathematics',
    downloadUrl: '',
    totalPages: 250,
    coverUrl: ''
  });

  // Load Library Data
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const bookRes = await api.getBooks();
      if (bookRes.success) {
        setBooks(bookRes.books);
      } else {
        setError(bookRes.error || 'Failed to download bookstore files.');
      }

      if (user) {
        const myBookRes = await api.getMyBooks();
        if (myBookRes.success) {
          setMyBooks(myBookRes.books);
        }
        
        if (user.role === 'admin' || user.role === 'super_admin') {
          const purchasesRes = await api.adminGetPurchases();
          if (purchasesRes.success) {
            setPurchases(purchasesRes.purchases);
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Network communication error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Handle Checkout / Free Acquire
  const handleAcquireBook = async (book: Book) => {
    if (!user) {
      setError('Please create an account or sign in to acquire books.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (book.price === 0) {
      // Free book - direct unlock
      try {
        setLoading(true);
        const res = await api.buyBook(book.id);
        if (res.success) {
          setPurchaseSuccess(`"The complete ${book.title}" is now permanently unlocked in your Studynet Library!`);
          loadData();
          setTimeout(() => setPurchaseSuccess(null), 6000);
        } else {
          setError(res.error || 'Failed to acquire free textbook.');
        }
      } catch (err: any) {
        setError(err.message || 'Network error.');
      } finally {
        setLoading(false);
      }
    } else {
      // Paid book - trigger checkout modal
      setCheckingOutBook(book);
    }
  };

  // Process Mock Checkout payment
  const processCheckoutPayment = async () => {
    if (!checkingOutBook || !user) return;
    try {
      setProcessingPayment(true);
      setError(null);
      
      // Simulate gateway delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const res = await api.buyBook(checkingOutBook.id);
      if (res.success) {
        setPurchaseSuccess(`Congratulations! Your payment for "${checkingOutBook.title}" was verified. Access code issued successfully.`);
        setCheckingOutBook(null);
        loadData();
        setTimeout(() => setPurchaseSuccess(null), 7000);
      } else {
        setError(res.error || 'Payment rejection or ledger sync failure.');
      }
    } catch (err: any) {
      setError(err.message || 'Payment system offline.');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Admin Add / Update Book Submit
  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) return;

    try {
      setLoading(true);
      setError(null);

      let res;
      if (editingBookId) {
        res = await api.adminUpdateBook(editingBookId, bookForm);
      } else {
        res = await api.adminAddBook(bookForm);
      }

      if (res.success) {
        setIsFormOpen(false);
        setEditingBookId(null);
        resetBookForm();
        loadData();
        setPurchaseSuccess(editingBookId ? 'Book successfully updated.' : 'New academic book successfully added to catalog.');
        setTimeout(() => setPurchaseSuccess(null), 4000);
      } else {
        setError(res.error || 'Failed to save book data.');
      }
    } catch (err: any) {
      setError(err.message || 'Save error.');
    } finally {
      setLoading(false);
    }
  };

  // Admin Edit Book trigger
  const handleEditTrigger = (book: Book) => {
    setEditingBookId(book.id);
    setBookForm({
      title: book.title,
      author: book.author,
      price: book.price,
      description: book.description,
      category: book.category,
      downloadUrl: book.downloadUrl || '',
      totalPages: book.totalPages || 200,
      coverUrl: book.coverUrl || ''
    });
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Admin Delete Book
  const handleDeleteBook = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this book from the catalog?')) return;
    try {
      setLoading(true);
      const res = await api.adminDeleteBook(id);
      if (res.success) {
        loadData();
        setPurchaseSuccess('Textbook permanently purged from catalog.');
        setTimeout(() => setPurchaseSuccess(null), 4000);
      } else {
        setError(res.error || 'Delete failed.');
      }
    } catch (err: any) {
      setError(err.message || 'Network delay error.');
    } finally {
      setLoading(false);
    }
  };

  const resetBookForm = () => {
    setBookForm({
      title: '',
      author: '',
      price: 0,
      description: '',
      category: 'Mathematics',
      downloadUrl: '',
      totalPages: 250,
      coverUrl: ''
    });
    setEditingBookId(null);
  };

  const categories = ['All', 'Mathematics', 'Computer Science', 'Chemistry', 'Cognitive Science', 'Engineering', 'Literature'];

  // Filter Logic
  const filteredBooks = books.filter(b => {
    const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || b.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const isPurchased = (bookId: string) => {
    return myBooks.some(mb => mb.id === bookId);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16 relative overflow-hidden">
      <SEO title="Digital Library & bookstore" description="Access full curriculum textbooks, user-uploaded guides, and interactive worksheets compiled by expert AI tutors." />
      {/* Decorative Blur Backdrops */}
      <div className="absolute top-[-10%] left-[-20%] w-[60%] h-[50%] rounded-full bg-indigo-900/10 blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/10 blur-[160px] pointer-events-none" />

      {/* Hero Banner Grid */}
      <header className="relative py-12 px-4 sm:px-6 lg:px-8 border-b border-slate-900/80 bg-slate-950/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full text-xs font-bold tracking-wider text-indigo-400 uppercase mb-3">
              <Compass className="w-3.5 h-3.5" />
              <span>StudyNet Publishing Hub</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white uppercase tracking-wide">
              Academic <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">Bookstore & Library</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              Browse professional textbooks, peer-reviewed reference notebooks, or claim open-source libraries. Read instantly with our AI companion.
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="bg-slate-900/60 border border-slate-800/80 px-4 py-3 rounded-2xl">
              <div className="text-xs text-slate-400 font-mono">Available Books</div>
              <div className="text-lg font-black text-indigo-400 font-sans mt-0.5">{books.length} Titles</div>
            </div>
            {user && (
              <div className="bg-slate-900/60 border border-slate-800/80 px-4 py-3 rounded-2xl">
                <div className="text-xs text-slate-400 font-mono">My Unlocks</div>
                <div className="text-lg font-black text-purple-400 font-sans mt-0.5">{myBooks.length} Books</div>
              </div>
            )}
            {user && (user.role === 'admin' || user.role === 'super_admin') && (
              <div className="bg-indigo-950/35 border border-indigo-500/20 px-4 py-3 rounded-2xl">
                <div className="text-xs text-indigo-300 font-mono flex items-center gap-1.5 uppercase tracking-wider font-extrabold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Faculty Panel
                </div>
                <div className="text-lg font-black text-rose-450 text-white font-sans mt-0.5 font-black uppercase text-xs">Access Granted</div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {/* Status Alerts */}
        {purchaseSuccess && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs sm:text-sm font-medium flex items-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.05)] animate-fade-in">
            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>{purchaseSuccess}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs sm:text-sm font-medium flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-slate-400 hover:text-white font-black text-xs">Dismiss</button>
          </div>
        )}

        {/* Tab Buttons to Swap Library View */}
        <div className="flex items-center border-b border-slate-900/60 pb-3 mb-8 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('store')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold uppercase tracking-wider transition ${
              activeTab === 'store'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 border border-indigo-400/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Bookstore Catalog</span>
          </button>

          {user && (
            <button
              onClick={() => setActiveTab('library')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold uppercase tracking-wider transition ${
                activeTab === 'library'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25 border border-purple-400/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>My Study Library ({myBooks.length})</span>
            </button>
          )}

          {user && (user.role === 'admin' || user.role === 'super_admin') && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold uppercase tracking-wider transition ml-auto ${
                activeTab === 'admin'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-650/25 border border-rose-450/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent border border-rose-550/10'
              }`}
            >
              <Edit className="w-4 h-4" />
              <span>Manage Store</span>
            </button>
          )}
        </div>

        {/* --- BOOKSTORE VIEW --- */}
        {activeTab === 'store' && (
          <div>
            {/* Search and Category Filters Row */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
              <div className="relative w-full md:max-w-md">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search book titles, authors, or subjects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800/80 rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Dynamic Category Pill Row */}
              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
                <Filter className="w-3.5 h-3.5 text-indigo-400 mr-1 flex-shrink-0" />
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase transition whitespace-nowrap ${
                      selectedCategory === cat
                        ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-300'
                        : 'bg-slate-900/40 border border-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Catalog Grid View */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <div className="w-10 h-10 border-4 border-slate-800 border-t-indigo-500 rounded-full animate-spin mb-4" />
                <p className="text-xs font-mono tracking-widest uppercase">Syncing Book Catalogs...</p>
              </div>
            ) : filteredBooks.length === 0 ? (
              <div className="bg-slate-900/25 border border-slate-900 rounded-3xl p-12 text-center max-w-xl mx-auto">
                <BookOpen className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">No Textbooks Found</h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                  We currently have no books matching your search filters in our index. Adjust your queries or categories and try again.
                </p>
                {searchQuery || selectedCategory !== 'All' ? (
                  <button
                    onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                    className="mt-4 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 font-bold text-xs uppercase tracking-wider rounded-xl transition border border-indigo-500/15"
                  >
                    Clear Filter Constraints
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredBooks.map((book) => {
                  const owned = isPurchased(book.id);
                  return (
                    <article 
                      key={book.id}
                      className="bg-slate-950/60 border border-slate-900/80 rounded-3xl overflow-hidden hover:border-indigo-500/30 transition-all duration-300 hover:shadow-[0_12px_24px_rgba(99,102,241,0.06)] flex flex-col group relative"
                    >
                      {/* Price Tag Badge */}
                      <div className="absolute top-3 right-3 z-30">
                        {book.price === 0 ? (
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                            Free Textbook
                          </span>
                        ) : (
                          <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider font-mono">
                            ${book.price.toFixed(2)}
                          </span>
                        )}
                      </div>

                      {/* Cover Thumbnail wrapper */}
                      <div className="aspect-[4/3] bg-slate-900 relative overflow-hidden group-hover:scale-105 transition-transform duration-300">
                        <img 
                          src={book.coverUrl || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400'} 
                          alt={book.title}
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/50 to-transparent" />
                        
                        {/* Category Label */}
                        <span className="absolute bottom-3 left-4 bg-slate-900/90 text-slate-300 border border-slate-850 px-2 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wider font-mono">
                          {book.category}
                        </span>
                      </div>

                      {/* Book Content details */}
                      <div className="p-5 flex-1 flex flex-col">
                        <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight line-clamp-1 group-hover:text-indigo-400 transition-colors">
                          {book.title}
                        </h3>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5 mb-3 flex items-center gap-1.5">
                          <UserIcon className="w-3 h-3 text-slate-500" />
                          <span>{book.author}</span>
                        </p>

                        <p className="text-slate-400 text-xs line-clamp-3 mb-4 leading-relaxed flex-1">
                          {book.description}
                        </p>

                        {/* Additional detail row */}
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mb-4 border-t border-slate-900 pt-3">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5" />
                            {book.totalPages || 240} Pages
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                            {book.rating || 5.0} Score
                          </span>
                        </div>

                        {/* Interactive trigger action buttons */}
                        <div className="mt-auto space-y-2">
                          {owned ? (
                            <button
                              onClick={() => {
                                setSelectedBook(book);
                                setActiveTab('library');
                              }}
                              className="w-full py-2.5 rounded-xl bg-purple-900/35 border border-purple-500/20 text-purple-300 hover:bg-purple-900/40 font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4 text-purple-400" />
                              <span>Owned • Go to library</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAcquireBook(book)}
                              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 group-hover:shadow-[0_4px_12px_rgba(99,102,241,0.25)] cursor-pointer"
                            >
                              {book.price === 0 ? <Download className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                              <span>{book.price === 0 ? 'Download Free' : `Buy • $${book.price}`}</span>
                            </button>
                          )}

                          {/* Quick preview button */}
                          <button
                            onClick={() => setSelectedBook(book)}
                            className="w-full py-2 text-[10px] tracking-wider uppercase font-black text-slate-400 hover:text-white transition"
                          >
                            Details & Syllabus
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* --- DEDICATED STUDENT LIBRARY VIEW --- */}
        {activeTab === 'library' && (
          <div>
            {myBooks.length === 0 ? (
              <div className="bg-slate-900/20 border border-slate-900 rounded-3xl p-12 text-center max-w-xl mx-auto py-16">
                <Bookmark className="w-12 h-12 text-purple-500/30 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Your Personal Study Library is Empty</h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-sm mx-auto mb-6">
                  Once you claim free reference guidelines or purchase exclusive textbooks from our store, they will appear right here for direct access.
                </p>
                <button
                  onClick={() => setActiveTab('store')}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-white font-black text-xs uppercase tracking-widest rounded-xl transition shadow-lg shadow-indigo-950"
                >
                  Explore Store Catalog
                </button>
              </div>
            ) : (
              <div>
                <p className="text-slate-400 text-xs font-mono tracking-wider uppercase mb-6 bg-purple-500/5 inline-block px-3 py-1 rounded-full border border-purple-500/10">
                  ⚡ Permanently Unlocked Library Logs
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {myBooks.map((book) => (
                    <div 
                      key={book.id} 
                      className="bg-slate-950/60 border border-purple-900/20 rounded-3xl p-5 flex flex-col sm:flex-row gap-5 hover:border-purple-500/20 transition-all group"
                    >
                      <div className="w-full sm:w-32 aspect-[3/4] bg-slate-900 rounded-2xl overflow-hidden flex-shrink-0">
                        <img 
                          src={book.coverUrl || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400'} 
                          alt={book.title} 
                          className="w-full h-full object-cover opacity-75"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <span className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[9px] font-mono uppercase tracking-wider">
                            {book.category}
                          </span>
                          <h3 className="font-extrabold text-sm sm:text-base text-white mt-2 group-hover:text-purple-300 transition-colors">
                            {book.title}
                          </h3>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">By {book.author}</p>
                          <p className="text-slate-450 text-[11px] leading-relaxed text-slate-400 mt-2 line-clamp-2">
                            {book.description}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-slate-900 flex flex-wrap items-center justify-between gap-3 mt-4">
                          <span className="text-[10px] font-mono text-slate-500">
                            {book.totalPages || 200} Pages • eBook format
                          </span>

                          <div className="flex gap-2">
                            <button
                              onClick={() => setSelectedBook(book)}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-[10px] uppercase tracking-wider rounded-lg transition"
                            >
                              Syllabus details
                            </button>
                            <a
                              href={book.downloadUrl || '#'}
                              target="_blank"
                              rel="noreferrer"
                              className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-black text-[10px] uppercase tracking-wider rounded-lg transition flex items-center gap-1"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Read Textbook PDF</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- ADMIN OPERATIONS DASHBOARD --- */}
        {activeTab === 'admin' && user && (user.role === 'admin' || user.role === 'super_admin') && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Book creator/edit form panel */}
            <section className="lg:col-span-4 bg-slate-950/60 border border-slate-900 rounded-3xl p-6 h-fit relative">
              <h3 className="text-sm font-black uppercase tracking-wider text-rose-450 border-b border-rose-950 pb-3 mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-rose-500" />
                <span>{editingBookId ? 'Update Textbook File' : 'Publish New Academic Book'}</span>
              </h3>

              <form onSubmit={handleBookSubmit} className="space-y-4 text-xs font-mono">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Book Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Advanced Calculus & Physics"
                    value={bookForm.title}
                    onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Syllabus Author *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Maruti P Ghorpade"
                      value={bookForm.author}
                      onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Pricing (USD) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0"
                      placeholder="0 for FREE"
                      value={bookForm.price}
                      onChange={(e) => setBookForm({ ...bookForm, price: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Category *</label>
                    <select
                      value={bookForm.category}
                      onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-rose-500"
                    >
                      <option value="Mathematics">Mathematics</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Cognitive Science">Cognitive Science</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Literature">Literature</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Total Pages</label>
                    <input
                      type="number"
                      placeholder="250"
                      value={bookForm.totalPages}
                      onChange={(e) => setBookForm({ ...bookForm, totalPages: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Syllabus Overview / description *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Provide details about chapters or syllabus covered..."
                    value={bookForm.description}
                    onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Cover Image (Unsplash URL)</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={bookForm.coverUrl}
                    onChange={(e) => setBookForm({ ...bookForm, coverUrl: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Book PDF / download URL</label>
                  <input
                    type="url"
                    placeholder="https://.../textbook.pdf"
                    value={bookForm.downloadUrl}
                    onChange={(e) => setBookForm({ ...bookForm, downloadUrl: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  {editingBookId && (
                    <button
                      type="button"
                      onClick={resetBookForm}
                      className="w-1/2 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 font-extrabold uppercase"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className={`rounded-xl py-2.5 text-white font-extrabold uppercase tracking-wider text-xs transition duration-200 ${
                      editingBookId ? 'bg-amber-600 hover:bg-amber-500 w-1/2' : 'bg-rose-600 hover:bg-rose-500 w-full'
                    }`}
                  >
                    {editingBookId ? 'Save Changes' : 'Publish Book'}
                  </button>
                </div>
              </form>
            </section>

            {/* Catalog list + Purchases log */}
            <div className="lg:col-span-8 space-y-8">
              {/* Existing Bookstore Inventory catalog */}
              <section className="bg-slate-950/60 border border-slate-900 rounded-3xl p-6">
                <h3 className="text-xs font-black uppercase tracking-wider mb-4 flex items-center justify-between text-slate-300">
                  <span>Store Inventory ({books.length} Books)</span>
                  <span className="text-[9px] text-slate-5 distributed-mono font-mono text-slate-500">Live Database synced</span>
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-300 border-collapse">
                    <thead>
                      <tr className="border-b border-slate-900 font-mono text-[10px] text-slate-500 uppercase">
                        <th className="pb-3 text-slate-400">Book Details</th>
                        <th className="pb-3 text-slate-400">Category</th>
                        <th className="pb-3 text-slate-400">Price</th>
                        <th className="pb-3 text-slate-400 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {books.map((b) => (
                        <tr key={b.id} className="border-b border-slate-900 py-3 hover:bg-slate-900/15">
                          <td className="py-3">
                            <span className="block font-black text-white text-[12px]">{b.title}</span>
                            <span className="block text-[11px] text-slate-450 text-slate-400">by {b.author}</span>
                          </td>
                          <td className="py-3 font-mono">{b.category}</td>
                          <td className="py-3 font-mono">
                            {b.price === 0 ? (
                              <span className="text-emerald-400">Free</span>
                            ) : (
                              <span className="text-indigo-400 font-medium">${b.price.toFixed(2)}</span>
                            )}
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => handleEditTrigger(b)}
                                className="p-1.5 rounded-lg bg-slate-905 hover:bg-slate-900 text-slate-300 hover:text-white transition"
                                title="Edit Pricing or Details"
                              >
                                <Edit className="w-3.5 h-3.5 text-amber-400" />
                              </button>
                              <button
                                onClick={() => handleDeleteBook(b.id)}
                                className="p-1.5 rounded-lg bg-[#ef44440a] hover:bg-rose-950/20 text-rose-450 transition"
                                title="Purge Textbook"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Purchase Transactions Ledger logs */}
              <section className="bg-slate-950/60 border border-slate-900 rounded-3xl p-6">
                <h3 className="text-xs font-black uppercase tracking-wider mb-4 flex items-center justify-between text-rose-450">
                  <span className="flex items-center gap-1.5">
                    <ListOrdered className="w-4 h-4 text-indigo-400" />
                    Student Access Logs (Sales ledger)
                  </span>
                  <span className="text-[9px] text-rose-500 font-mono tracking-widest uppercase">Secret Audit Channel</span>
                </h3>

                {purchases.length === 0 ? (
                  <p className="font-mono text-slate-500 text-[11px] text-center py-6">
                    No transactions registered in this sandbox period yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left text-slate-400 border-collapse">
                      <thead>
                        <tr className="border-b border-slate-900 font-mono text-[9px] text-slate-500 uppercase">
                          <th className="pb-2">Date</th>
                          <th className="pb-2">Student</th>
                          <th className="pb-2">Academic textbook</th>
                          <th className="pb-2 text-right">Paid</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchases.map((p) => (
                          <tr key={p.id} className="border-b border-slate-900 py-2.5 font-mono text-[11px]">
                            <td className="py-2.5">{new Date(p.purchaseDate).toLocaleDateString()}</td>
                            <td className="py-2.5">
                              <span className="font-black text-white block">{p.username}</span>
                              <span className="text-[10px] text-slate-500 block">{p.email}</span>
                            </td>
                            <td className="py-2.5 font-sans font-bold text-slate-300">{p.bookTitle}</td>
                            <td className="py-2.5 text-right font-mono text-white text-emerald-400 font-bold">
                              ${Number(p.amountPaid).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          </div>
        )}
      </main>

      {/* --- SIDE-SHEET/MODAL FOR SYLLABUS DETAILS --- */}
      {selectedBook && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b1329] border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-6 relative">
              <button 
                onClick={() => setSelectedBook(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-4 mb-4">
                <span className="px-2 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-mono tracking-wider uppercase">
                  {selectedBook.category}
                </span>
                <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                  <Star className="w-3 text-amber-400 fill-amber-400" />
                  Score {selectedBook.rating || 5}
                </span>
              </div>

              <h3 className="text-xl font-extrabold text-white mb-1">{selectedBook.title}</h3>
              <p className="text-xs text-slate-400 font-mono mb-4">Author: {selectedBook.author}</p>

              <div className="prose prose-invert text-xs text-slate-300 max-w-none leading-relaxed space-y-3 border-t border-slate-900 pt-4">
                <p className="font-sans text-slate-300 text-sm">{selectedBook.description}</p>
                
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 font-mono pt-3">Recommended Syllabus Topics Include:</h4>
                <ul className="list-disc pl-4 space-y-1.5 text-slate-400 font-sans">
                  <li>Detailed walkthrough problems analyzed by generative AI solutions.</li>
                  <li>Annotated conceptual diagrams with formula summary configurations.</li>
                  <li>Handwriting practice exercise sets customized per academic goals.</li>
                  <li>Compatible with StudyNet.AI high-limit voice solved transcripts.</li>
                </ul>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-900 flex items-center justify-between">
                <div>
                  <span className="block text-[9px] text-slate-500 font-mono">PUBLISHING NO:</span>
                  <span className="text-xs font-mono text-indigo-300 uppercase font-bold">{selectedBook.id}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedBook(null)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 uppercase font-black text-xs tracking-wider"
                  >
                    Close
                  </button>
                  {!isPurchased(selectedBook.id) && (
                    <button
                      onClick={() => {
                        setSelectedBook(null);
                        handleAcquireBook(selectedBook);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-505 text-white font-black text-xs uppercase tracking-wider transition"
                    >
                      {selectedBook.price === 0 ? 'Acquire for Free' : `Buy for $${selectedBook.price}`}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- SECURE CHECKOUT PAYMENT CAPTURE INJECTED --- */}
      {checkingOutBook && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b1329] border border-indigo-500/20 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative">
            
            <header className="px-6 py-4 border-b border-slate-900 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-widest text-[#a5b4fc] flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4 text-indigo-400" />
                Secure Billing Gateway
              </span>
              <button 
                onClick={() => setCheckingOutBook(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </header>

            <main className="p-6 space-y-6">
              {/* Product brief row */}
              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex justify-between items-center">
                <div>
                  <span className="block text-[10px] uppercase font-mono text-slate-500">Selected Textbook</span>
                  <span className="font-extrabold text-sm text-white">{checkingOutBook.title}</span>
                  <span className="block text-[10px] text-slate-400">By {checkingOutBook.author}</span>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="block text-[10px] uppercase font-mono text-slate-500">Order Total</span>
                  <span className="font-mono text-indigo-300 font-extrabold text-base">${checkingOutBook.price.toFixed(2)}</span>
                </div>
              </div>

              {/* Secure Credit card visual */}
              <div className="bg-gradient-to-tr from-indigo-800 to-indigo-950 p-5 rounded-2xl border border-indigo-400/20 shadow-lg text-white font-mono relative overflow-hidden flex flex-col justify-between h-40">
                <div className="absolute right-0 top-0 opacity-10 w-40 h-40 bg-white rounded-full blur-xl pointer-events-none" />
                <div className="flex justify-between items-start">
                  <span className="text-xs font-extrabold italic tracking-wider">StudyNet Platinum</span>
                  <span className="text-indigo-400 text-[10px] border border-indigo-400/40 px-2 py-0.5 rounded uppercase">Sandbox Link</span>
                </div>

                <div className="text-sm tracking-widest font-black py-4 select-all text-indigo-100">{checkoutCard.number}</div>

                <div className="flex justify-between text-[9px] uppercase tracking-wider">
                  <div>
                    <span className="block text-[7px] text-indigo-300">Student Holder</span>
                    <span className="font-black text-white">{checkoutCard.name}</span>
                  </div>
                  <div>
                    <span className="block text-[7px] text-indigo-300">Expiry</span>
                    <span>{checkoutCard.expiry}</span>
                  </div>
                  <div>
                    <span className="block text-[7px] text-indigo-300">CVV</span>
                    <span>{checkoutCard.cvv}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-[10px] font-mono text-slate-400 leading-relaxed bg-[#ef444405] p-3 rounded-lg border border-red-550/5 flex gap-2">
                  <AlertCircle className="w-4 h-4 text-[#818cf8] flex-shrink-0 mt-0.5" />
                  <span>
                    This billing form operates inside a sandboxed developer workspace. Clicking "Confirm Checkout" will complete the mock credit transaction of ${checkingOutBook.price.toFixed(2)} instantly and unlock permanent offline download resources of this textbook.
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-slate-500 justify-center">
                  <span className="w-2 h-2 rounded bg-indigo-500" />
                  <span>PCI-DSS Secured Ledger Sync</span>
                </div>
              </div>
            </main>

            <footer className="px-6 py-4 bg-slate-950/70 border-t border-slate-900 flex justify-end gap-2.5">
              <button
                onClick={() => setCheckingOutBook(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider"
              >
                Cancel
              </button>
              <button
                onClick={processCheckoutPayment}
                disabled={processingPayment}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-black text-xs uppercase tracking-wider transition flex items-center gap-2 cursor-pointer"
              >
                {processingPayment ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-white rounded-full animate-spin" />
                    <span>Authorizing Pay...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Confirm Checkout • ${checkingOutBook.price.toFixed(2)}</span>
                  </>
                )}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
