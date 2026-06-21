/**
 * Core Type Definitions for StudyBot AI
 */

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string; // Stored securely
  role: 'user' | 'admin' | 'super_admin';
  plan: 'free' | 'basic' | 'pro';
  isBanned: boolean;
  dailyMessagesCount: number;
  lastMessageDate: string; // ISO date string or YYYY-MM-DD
  createdAt: string;
  
  // OTP Verification details
  isVerified?: boolean;
  otpHash?: string;
  otpExpiry?: string;
  otpAttempts?: number;
  otpLastRequested?: string;
  purchasedBookIds?: string[];
}

export interface Book {
  id: string;
  title: string;
  author: string;
  price: number; // 0 = Free
  description: string;
  coverUrl?: string;
  category: string;
  downloadUrl?: string;
  totalPages?: number;
  rating?: number;
  createdAt: string;
}

export interface Purchase {
  id: string;
  userId: string;
  bookId: string;
  amountPaid: number;
  purchaseDate: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  attachedImage?: string; // Base64 encoding
  attachedFile?: { name: string; type: string; base64: string };
  timestamp: string;
  diagrams?: Array<{ title: string; url: string }>;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  messages: ChatMessage[];
}

export interface SystemSettings {
  systemPrompt: string;
  enableImageAI: boolean;
  enableVoiceAI: boolean;
  dailyLimitPerUser: number;
  chatbotTone: 'friendly' | 'academic' | 'rigorous' | 'encouraging';
  
  // Dynamic subscription controls
  freePlanLimit: number;
  basicPlanLimit: number;
  proPlanLimit: number;
  enableImageFree: boolean;
  enableImageBasic: boolean;
  enableImagePro: boolean;
  enableFileFree: boolean;
  enableFileBasic: boolean;
  enableFilePro: boolean;

  // OTP Controls
  enableOTPVerification?: boolean;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  refreshToken?: string;
  user?: {
    id: string;
    username: string;
    email: string;
    role: 'user' | 'admin' | 'super_admin';
    plan: 'free' | 'basic' | 'pro';
    isVerified?: boolean;
  };
  error?: string;
  requiresVerification?: boolean;
  userId?: string;
  email?: string;
  message?: string;
  debugOtp?: string;
}

export interface SystemStats {
  totalUsers: number;
  totalChats: number;
  totalMessages: number;
  bannedUsers: number;
  activeSessionsToday: number;
  usageByDay: { date: string; count: number }[];
}

export interface CustomPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  visible: boolean;
  createdAt: string;
  isHtml?: boolean;
}

export interface MediaItem {
  id: string;
  name: string;
  type: string;
  size: number;
  base64: string; // Raw base64 data stream for serving
  createdAt: string;
}

export interface NavigationMenu {
  id: string;
  label: string;
  link: string;
  order: number;
  parentId?: string;
}
