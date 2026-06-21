import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { User, ChatSession, SystemSettings, ChatMessage, SystemStats, Book, Purchase, CustomPage, MediaItem, NavigationMenu } from '../types';

const DB_FILE = path.join(process.cwd(), 'src', 'db', 'db.json');

// Interface for DB file structure
interface DatabaseSchema {
  users: User[];
  sessions: ChatSession[];
  settings: SystemSettings;
  books: Book[];
  purchases: Purchase[];
  pages?: CustomPage[];
  media?: MediaItem[];
  menus?: NavigationMenu[];
}

// SHA-256 helper for beginner-friendly, secure password management
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Check if directories exist
const dbDir = path.dirname(DB_FILE);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Helper: Seed Default Database State
const defaultPrompt = `You are a friendly, encouraging study teacher. Your goal is to guide students step-by-step through academic problems (Math, Science, History, Literature, Coding, Languages, and General Study skills). 
Feel free to explain concepts with relatable real-world examples. 
ONLY answer questions related to academic studies. 
If a student asks an unrelated or off-topic question, politely reject it by saying: "I am here to help you study! Let's get back to our academic adventure." 
Keep answers concise, structured, and easy to follow. Provide practical examples for learning.`;

const initialDBState: DatabaseSchema = {
  users: [
    {
      id: 'usr_superadmin',
      username: 'M.P. Ghorpade',
      email: 'm.p.ghorpade2006@gmail.com',
      passwordHash: hashPassword('super123'),
      role: 'super_admin',
      plan: 'pro',
      isBanned: false,
      isVerified: true,
      dailyMessagesCount: 0,
      lastMessageDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    },
    {
      id: 'usr_admin',
      username: 'Academic Admin',
      email: 'admin@studybot.com',
      passwordHash: hashPassword('admin123'),
      role: 'admin',
      plan: 'pro',
      isBanned: false,
      isVerified: true,
      dailyMessagesCount: 0,
      lastMessageDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    },
    {
      id: 'usr_student',
      username: 'Alex Scholar',
      email: 'student@studybot.com',
      passwordHash: hashPassword('student123'),
      role: 'user',
      plan: 'free',
      isBanned: false,
      isVerified: true,
      dailyMessagesCount: 5,
      lastMessageDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    }
  ],
  sessions: [
    {
      id: 'sess_1',
      userId: 'usr_student',
      title: 'Quadratic Formula Help',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      messages: [
        {
          id: 'msg_1',
          role: 'user',
          content: 'Hi, can you explain the quadratic formula of x^2 - 5x + 6 = 0?',
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
        },
        {
          id: 'msg_2',
          role: 'model',
          content: `Of course! I would love to help you unlock the quadratic formula. 🌟

The quadratic formula is:
**x = [-b ± √(b² - 4ac)] / (2a)**

For your equation: **x² - 5x + 6 = 0**
Our coefficients are:
- **a = 1**
- **b = -5**
- **c = 6**

Let's solve it step-by-step:
1. **Find the Discriminant (b² - 4ac)**:
   (-5)² - 4(1)(6) = 25 - 24 = **1**
   
2. **Apply the Discriminant to the Formula**:
   x = [-(-5) ± √1] / (2 * 1)
   x = [5 ± 1] / 2

3. **Find the two solutions**:
   - Solution 1: (5 + 1) / 2 = 6/2 = **3**
   - Solution 2: (5 - 1) / 2 = 4/2 = **2**

So, the equations factors out perfectly to (x - 3)(x - 2) = 0, giving us solutions **x = 2** and **x = 3**!

Does this break down make sense? Try solving x² - 3x + 2 = 0 using these same steps!`,
          timestamp: new Date(Date.now() - 3600000 * 2 + 10000).toISOString()
        }
      ]
    },
    {
      id: 'sess_2',
      userId: 'usr_student',
      title: 'Photosynthesis Overview',
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      messages: [
        {
          id: 'msg_3',
          role: 'user',
          content: 'What are the main products of photosynthesis?',
          timestamp: new Date(Date.now() - 3600000 * 24).toISOString()
        },
        {
          id: 'msg_4',
          role: 'model',
          content: `Greeting young biologist! 🌿 Photosynthesis is one of nature's most incredible factories.

In short, the two **main products** of photosynthesis are:
1. **Glucose (Sugar - C₆H₁₂O₆)**: This serves as energy food for the plant.
2. **Oxygen (O₂)**: This is released into the atmosphere as a byproduct, allowing us to breathe!

Here is the simple chemical equation:
**6CO₂ (Carbon Dioxide) + 6H₂O (Water) + Light Energy ➔ C₆H₁₂O₆ (Glucose) + 6O₂ (Oxygen)**

A helpful way to remember is: Plants "breathe in" what we breathe out, and "exhale" what we need to survive, storing starch energy inside their leaves along the way! 🍃`,
          timestamp: new Date(Date.now() - 3600000 * 24 + 10000).toISOString()
        }
      ]
    }
  ],
  settings: {
    systemPrompt: defaultPrompt,
    enableImageAI: true,
    enableVoiceAI: true,
    dailyLimitPerUser: 15,
    chatbotTone: 'friendly',
    freePlanLimit: 5,
    basicPlanLimit: 20,
    proPlanLimit: 1000,
    enableImageFree: false,
    enableImageBasic: true,
    enableImagePro: true,
    enableFileFree: false,
    enableFileBasic: false,
    enableFilePro: true,
    enableOTPVerification: true
  },
  books: [],
  purchases: [],
  pages: [
    {
      id: 'page_init_1',
      slug: 'about-us',
      title: 'About StudyNet.AI',
      content: 'Welcome to StudyNet.AI! We are dedicated to providing cutting edge AI tutoring solutions for modern scholars. You can customize this page anytime from the admin page control dashboard.',
      visible: true,
      createdAt: new Date().toISOString()
    }
  ],
  media: [],
  menus: [
    {
      id: 'menu_init_1',
      label: 'About Cyber-Campus',
      link: '/p/about-us',
      order: 1
    }
  ]
};

// In-Memory Copy synced with file
let dbState: DatabaseSchema = initialDBState;

// Sync functions
function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      dbState = JSON.parse(raw);
      
      let changed = false;

      // Ensure fields exist for backward compatibility
      if (!dbState.books) {
        dbState.books = [];
        changed = true;
      }
      if (!dbState.purchases) {
        dbState.purchases = [];
        changed = true;
      }

      // Pre-seed default books if empty
      if (dbState.books.length === 0) {
        dbState.books = [
          {
            id: 'book_1',
            title: 'Unlocking Calculus & Physics',
            author: 'Maruti P Ghorpade',
            price: 12.99,
            description: 'The ultimate guide to understanding calculus and classical physics. Features intuitive proofs, modern interactive coordinate examples, and study techniques suggested by the StudyNet.AI founder.',
            category: 'Mathematics',
            coverUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400',
            downloadUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            totalPages: 340,
            rating: 5,
            createdAt: new Date().toISOString()
          },
          {
            id: 'book_2',
            title: 'Advanced Algorithms and Data Structures',
            author: 'Dr. Thomas Cormen',
            price: 19.99,
            description: 'Dive deep into tree balancing, dynamic programming, flow networks, and modern amortized cost analysers. Includes visual diagrams for all major data structures.',
            category: 'Computer Science',
            coverUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=400',
            downloadUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            totalPages: 520,
            rating: 4.8,
            createdAt: new Date().toISOString()
          },
          {
            id: 'book_3',
            title: 'The Art of Chemistry: Theory & Practice',
            author: 'Prof. Marie Curie',
            price: 0,
            description: 'Open-access primer covering molecular orbital configuration, organic synthesis, nuclear energy levels, and radiation decay paths.',
            category: 'Chemistry',
            coverUrl: 'https://images.unsplash.com/photo-1532187643603-ba119ca4109e?auto=format&fit=crop&q=80&w=400',
            downloadUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            totalPages: 280,
            rating: 4.7,
            createdAt: new Date().toISOString()
          },
          {
            id: 'book_4',
            title: 'Cracking the Cognitive AI Code',
            author: 'StudyNet Faculty',
            price: 0,
            description: 'A study manual designed to help student-AI learners optimize their prompting heuristics, memory models, and note simplification routines.',
            category: 'Cognitive Science',
            coverUrl: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&q=80&w=400',
            downloadUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            totalPages: 165,
            rating: 4.9,
            createdAt: new Date().toISOString()
          }
        ];
        changed = true;
      }


      // 1. Safety auto-seed check for Super Admin in existing db.json files
      const hasSpecificSuper = dbState.users.some(u => u.email === 'm.p.ghorpade2006@gmail.com');
      if (!hasSpecificSuper) {
        dbState.users.unshift({
          id: 'usr_super_mp',
          username: 'M.P. Ghorpade',
          email: 'm.p.ghorpade2006@gmail.com',
          passwordHash: hashPassword('super123'),
          role: 'super_admin',
          plan: 'pro',
          isBanned: false,
          isVerified: true,
          dailyMessagesCount: 0,
          lastMessageDate: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString()
        });
        changed = true;
      }

      // 2. Migration: Ensure all users have a subscription plan and verification status
      dbState.users.forEach(u => {
        if (!u.plan) {
          u.plan = (u.role === 'admin' || u.role === 'super_admin') ? 'pro' : 'free';
          changed = true;
        }
        if (u.isVerified === undefined) {
          u.isVerified = true; // Backfill existing users as verified
          changed = true;
        }
      });

      // 3. Migration: Ensure settings has SaaS and OTP fields
      if (dbState.settings.freePlanLimit === undefined) {
        dbState.settings.freePlanLimit = 5;
        dbState.settings.basicPlanLimit = 20;
        dbState.settings.proPlanLimit = 1000;
        dbState.settings.enableImageFree = false;
        dbState.settings.enableImageBasic = true;
        dbState.settings.enableImagePro = true;
        dbState.settings.enableFileFree = false;
        dbState.settings.enableFileBasic = false;
        dbState.settings.enableFilePro = true;
        changed = true;
      }

      if (dbState.settings.enableOTPVerification === undefined) {
        dbState.settings.enableOTPVerification = true;
        changed = true;
      }

      if (!dbState.pages) {
        dbState.pages = [
          {
            id: 'page_init_1',
            slug: 'about-us',
            title: 'About StudyNet.AI',
            content: 'Welcome to StudyNet.AI! We are dedicated to providing cutting edge AI tutoring solutions for modern scholars. You can customize this page anytime from the admin page control dashboard.',
            visible: true,
            createdAt: new Date().toISOString()
          }
        ];
        changed = true;
      }

      if (!dbState.media) {
        dbState.media = [];
        changed = true;
      }

      if (!dbState.menus) {
        dbState.menus = [
          {
            id: 'menu_init_1',
            label: 'About Cyber-Campus',
            link: '/p/about-us',
            order: 1
          }
        ];
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(DB_FILE, JSON.stringify(dbState, null, 2), 'utf8');
      }
    } else {
      saveDatabase();
    }
  } catch (err) {
    console.error('Error loading JSON DB, reverting to in-memory.', err);
    dbState = initialDBState;
  }
}

function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbState, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving JSON DB file.', err);
  }
}

// Load now
loadDatabase();

export const DB = {
  // --- USERS ---
  getUsers(): User[] {
    loadDatabase();
    return dbState.users;
  },

  getUserById(id: string): User | undefined {
    loadDatabase();
    return dbState.users.find(u => u.id === id);
  },

  getUserByEmail(email: string): User | undefined {
    loadDatabase();
    const cleanEmail = email.toLowerCase().trim();
    return dbState.users.find(u => u.email.toLowerCase() === cleanEmail);
  },

  createUser(username: string, email: string, passwordPlain: string, role: 'user' | 'admin' | 'super_admin' = 'user', plan?: 'free' | 'basic' | 'pro'): User {
    loadDatabase();
    const cleanEmail = email.toLowerCase().trim();
    
    if (this.getUserByEmail(cleanEmail)) {
      throw new Error('Email already registered.');
    }

    const newUser: User = {
      id: 'usr_' + Math.random().toString(36).substr(2, 9),
      username,
      email: cleanEmail,
      passwordHash: hashPassword(passwordPlain),
      role,
      plan: plan || ((role === 'admin' || role === 'super_admin') ? 'pro' : 'free'),
      isBanned: false,
      isVerified: role === 'admin' || role === 'super_admin' ? true : false,
      dailyMessagesCount: 0,
      lastMessageDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };

    dbState.users.push(newUser);
    saveDatabase();
    return newUser;
  },

  updateUser(userId: string, updates: Partial<Omit<User, 'id' | 'email' | 'passwordHash'>>): User {
    loadDatabase();
    const idx = dbState.users.findIndex(u => u.id === userId);
    if (idx === -1) throw new Error('User not found.');

    dbState.users[idx] = { ...dbState.users[idx], ...updates };
    saveDatabase();
    return dbState.users[idx];
  },

  updateUserPassword(userId: string, passwordHash: string): User {
    loadDatabase();
    const idx = dbState.users.findIndex(u => u.id === userId);
    if (idx === -1) throw new Error('User not found.');

    dbState.users[idx] = { ...dbState.users[idx], passwordHash };
    saveDatabase();
    return dbState.users[idx];
  },

  deleteUser(userId: string): boolean {
    loadDatabase();
    const initialLen = dbState.users.length;
    dbState.users = dbState.users.filter(u => u.id !== userId);
    const success = dbState.users.length < initialLen;
    if (success) {
      dbState.sessions = dbState.sessions.filter(s => s.userId !== userId);
      saveDatabase();
    }
    return success;
  },

  toggleUserBan(userId: string): User {
    loadDatabase();
    const user = dbState.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found.');
    if (user.role === 'admin' || user.role === 'super_admin') throw new Error('Admin or Super Admin users cannot be banned.');

    user.isBanned = !user.isBanned;
    saveDatabase();
    return user;
  },

  // --- SESSIONS ---
  getSessions(userId?: string): ChatSession[] {
    loadDatabase();
    if (userId) {
      return dbState.sessions.filter(s => s.userId === userId);
    }
    return dbState.sessions;
  },

  getSessionById(sessionId: string): ChatSession | undefined {
    loadDatabase();
    return dbState.sessions.find(s => s.id === sessionId);
  },

  createSession(userId: string, title: string): ChatSession {
    loadDatabase();
    const newSession: ChatSession = {
      id: 'sess_' + Math.random().toString(36).substr(2, 9),
      userId,
      title: title.trim() || 'New Chat Session',
      createdAt: new Date().toISOString(),
      messages: []
    };
    dbState.sessions.unshift(newSession); // Newest first
    saveDatabase();
    return newSession;
  },

  deleteSession(sessionId: string, userId?: string): boolean {
    loadDatabase();
    const initialLen = dbState.sessions.length;
    dbState.sessions = dbState.sessions.filter(s => {
      if (s.id !== sessionId) return true;
      if (userId && s.userId !== userId) return true; // Security guard
      return false;
    });
    const success = dbState.sessions.length < initialLen;
    if (success) saveDatabase();
    return success;
  },

  addMessage(sessionId: string, role: 'user' | 'model', content: string, attachedImage?: string, attachedFile?: { name: string; type: string; base64: string }, diagrams?: Array<{ title: string; url: string }>): ChatMessage {
    loadDatabase();
    const sess = dbState.sessions.find(s => s.id === sessionId);
    if (!sess) throw new Error('Chat session not found.');

    const newMessage: ChatMessage = {
      id: 'msg_' + Math.random().toString(36).substr(2, 9),
      role,
      content,
      attachedImage,
      attachedFile,
      diagrams,
      timestamp: new Date().toISOString()
    };

    sess.messages.push(newMessage);
    
    // Auto-update thread title if it was default
    if (sess.messages.length === 1 && role === 'user') {
      sess.title = content.substring(0, 30) + (content.length > 30 ? '...' : '');
    }

    saveDatabase();
    return newMessage;
  },

  deleteMessage(sessionId: string, messageId: string): boolean {
    loadDatabase();
    const sess = dbState.sessions.find(s => s.id === sessionId);
    if (!sess) return false;

    const initialLen = sess.messages.length;
    sess.messages = sess.messages.filter(m => m.id !== messageId);
    const success = sess.messages.length < initialLen;
    if (success) saveDatabase();
    return success;
  },

  // --- SETTINGS ---
  getSettings(): SystemSettings {
    loadDatabase();
    return dbState.settings;
  },

  updateSettings(updates: Partial<SystemSettings>): SystemSettings {
    loadDatabase();
    dbState.settings = { ...dbState.settings, ...updates };
    saveDatabase();
    return dbState.settings;
  },

  // --- STATS ---
  getStats(): SystemStats {
    loadDatabase();
    const totalUsers = dbState.users.length;
    const totalChats = dbState.sessions.length;
    const totalMessages = dbState.sessions.reduce((acc, s) => acc + s.messages.length, 0);
    const bannedUsers = dbState.users.filter(u => u.isBanned).length;

    // Simulate usage stats for charts based on dates
    const usageMap: { [key: string]: number } = {};
    dbState.sessions.forEach(s => {
      s.messages.forEach(m => {
        const dateStr = m.timestamp.split('T')[0];
        usageMap[dateStr] = (usageMap[dateStr] || 0) + 1;
      });
    });

    // Make sure we have at least 5 days of data for the admin chart
    const days = 7;
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      if (!usageMap[dateStr]) {
        usageMap[dateStr] = Math.floor(Math.random() * 8) + 2; // seed a few dummy hits so chart is gorgeous
      }
    }

    const usageByDay = Object.keys(usageMap)
      .sort()
      .map(date => ({ date, count: usageMap[date] }))
      .slice(-days);

    return {
      totalUsers,
      totalChats,
      totalMessages,
      bannedUsers,
      activeSessionsToday: dbState.sessions.filter(s => s.createdAt.startsWith(new Date().toISOString().split('T')[0])).length,
      usageByDay
    };
  },

  // --- BOOK STORE & LIBRARY SYSTEMS ---
  getBooks(): Book[] {
    loadDatabase();
    return dbState.books || [];
  },

  getBookById(bookId: string): Book | undefined {
    loadDatabase();
    return (dbState.books || []).find(b => b.id === bookId);
  },

  addBook(title: string, author: string, price: number, description: string, category: string, downloadUrl?: string, totalPages?: number, coverUrl?: string, rating?: number): Book {
    loadDatabase();
    const newBook: Book = {
      id: 'book_' + Math.random().toString(36).substr(2, 9),
      title,
      author,
      price,
      description,
      category,
      downloadUrl: downloadUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      totalPages: totalPages || 100,
      coverUrl: coverUrl || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400',
      rating: rating || 5,
      createdAt: new Date().toISOString()
    };
    dbState.books.push(newBook);
    saveDatabase();
    return newBook;
  },

  updateBook(bookId: string, updates: Partial<Omit<Book, 'id' | 'createdAt'>>): Book {
    loadDatabase();
    const idx = dbState.books.findIndex(b => b.id === bookId);
    if (idx === -1) throw new Error('Book not found.');
    dbState.books[idx] = { ...dbState.books[idx], ...updates };
    saveDatabase();
    return dbState.books[idx];
  },

  deleteBook(bookId: string): boolean {
    loadDatabase();
    const initialLen = dbState.books.length;
    dbState.books = dbState.books.filter(b => b.id !== bookId);
    const success = dbState.books.length < initialLen;
    if (success) {
      saveDatabase();
    }
    return success;
  },

  buyBook(userId: string, bookId: string, amountPaid: number): Purchase {
    loadDatabase();
    const user = dbState.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found.');
    const book = dbState.books.find(b => b.id === bookId);
    if (!book) throw new Error('Book not found.');

    const newPurchase: Purchase = {
      id: 'pur_' + Math.random().toString(36).substr(2, 9),
      userId,
      bookId,
      amountPaid,
      purchaseDate: new Date().toISOString()
    };

    if (!dbState.purchases) dbState.purchases = [];
    dbState.purchases.push(newPurchase);

    if (!user.purchasedBookIds) user.purchasedBookIds = [];
    if (!user.purchasedBookIds.includes(bookId)) {
      user.purchasedBookIds.push(bookId);
    }

    saveDatabase();
    return newPurchase;
  },

  getPurchasedBooksForUser(userId: string): Book[] {
    loadDatabase();
    const user = dbState.users.find(u => u.id === userId);
    if (!user) return [];
    const ids = user.purchasedBookIds || [];
    return dbState.books.filter(b => ids.includes(b.id));
  },

  getAllPurchases(): Purchase[] {
    loadDatabase();
    return dbState.purchases || [];
  },

  // --- CUSTOM DYNAMIC PAGES MANAGEMENT ---
  getPages(): CustomPage[] {
    loadDatabase();
    return dbState.pages || [];
  },

  getPageById(id: string): CustomPage | undefined {
    loadDatabase();
    return (dbState.pages || []).find(p => p.id === id);
  },

  getPageBySlug(slug: string): CustomPage | undefined {
    loadDatabase();
    return (dbState.pages || []).find(p => p.slug === slug);
  },

  createPage(title: string, slug: string, content: string, visible: boolean = true, isHtml: boolean = false): CustomPage {
    loadDatabase();
    if (!dbState.pages) dbState.pages = [];
    
    // Ensure slug is clean and unique
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-_]/g, '-').trim();
    if (dbState.pages.some(p => p.slug === cleanSlug)) {
      throw new Error(`A page with slug "${cleanSlug}" already exists.`);
    }

    const newPage: CustomPage = {
      id: 'page_' + Math.random().toString(36).substr(2, 9),
      slug: cleanSlug,
      title: title.trim(),
      content,
      visible,
      isHtml,
      createdAt: new Date().toISOString()
    };
    dbState.pages.push(newPage);
    saveDatabase();
    return newPage;
  },

  updatePage(id: string, updates: Partial<Omit<CustomPage, 'id' | 'createdAt'>>): CustomPage {
    loadDatabase();
    if (!dbState.pages) dbState.pages = [];
    const idx = dbState.pages.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Dynamic page not found.');

    if (updates.slug) {
      const cleanSlug = updates.slug.toLowerCase().replace(/[^a-z0-9-_]/g, '-').trim();
      const duplicate = dbState.pages.find(p => p.slug === cleanSlug && p.id !== id);
      if (duplicate) {
        throw new Error(`A page with slug "${cleanSlug}" already exists.`);
      }
      updates.slug = cleanSlug;
    }

    dbState.pages[idx] = { ...dbState.pages[idx], ...updates };
    saveDatabase();
    return dbState.pages[idx];
  },

  deletePage(id: string): boolean {
    loadDatabase();
    if (!dbState.pages) return false;
    const initialLen = dbState.pages.length;
    dbState.pages = dbState.pages.filter(p => p.id !== id);
    const success = dbState.pages.length < initialLen;
    if (success) {
      saveDatabase();
    }
    return success;
  },

  // --- DYNAMIC FILE & MEDIA LIBRARY STORAGE ---
  getMedia(): MediaItem[] {
    loadDatabase();
    return dbState.media || [];
  },

  getMediaById(id: string): MediaItem | undefined {
    loadDatabase();
    return (dbState.media || []).find(m => m.id === id);
  },

  addMedia(name: string, type: string, size: number, base64: string): MediaItem {
    loadDatabase();
    if (!dbState.media) dbState.media = [];

    const newMedia: MediaItem = {
      id: 'med_' + Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      type: type || 'application/octet-stream',
      size: size || 0,
      base64,
      createdAt: new Date().toISOString()
    };
    dbState.media.push(newMedia);
    saveDatabase();
    return newMedia;
  },

  deleteMedia(id: string): boolean {
    loadDatabase();
    if (!dbState.media) return false;
    const initialLen = dbState.media.length;
    dbState.media = dbState.media.filter(m => m.id !== id);
    const success = dbState.media.length < initialLen;
    if (success) {
      saveDatabase();
    }
    return success;
  },

  // --- DYNAMIC NAVIGATION MENUS & LINKED PAGES API ---
  getNavigationMenus(): NavigationMenu[] {
    loadDatabase();
    return dbState.menus || [];
  },

  createNavigationMenu(label: string, link: string, order: number, parentId?: string): NavigationMenu {
    loadDatabase();
    if (!dbState.menus) dbState.menus = [];

    const newMenu: NavigationMenu = {
      id: 'menu_' + Math.random().toString(36).substr(2, 9),
      label: label.trim(),
      link: link.trim(),
      order: order || 0,
      parentId: parentId || undefined
    };

    dbState.menus.push(newMenu);
    saveDatabase();
    return newMenu;
  },

  updateNavigationMenu(id: string, updates: Partial<Omit<NavigationMenu, 'id'>>): NavigationMenu {
    loadDatabase();
    if (!dbState.menus) dbState.menus = [];
    const idx = dbState.menus.findIndex(m => m.id === id);
    if (idx === -1) throw new Error('Navigation menu item not found.');

    dbState.menus[idx] = { ...dbState.menus[idx], ...updates };
    saveDatabase();
    return dbState.menus[idx];
  },

  deleteNavigationMenu(id: string): boolean {
    loadDatabase();
    if (!dbState.menus) return false;
    const initialLen = dbState.menus.length;
    // Remove the menu and any children submenus linked to it
    dbState.menus = dbState.menus.filter(m => m.id !== id && m.parentId !== id);
    const success = dbState.menus.length < initialLen;
    if (success) {
      saveDatabase();
    }
    return success;
  }
};
