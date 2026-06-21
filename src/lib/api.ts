import { AuthResponse } from '../types';

const API_BASE = '/api';

// Globally safeguard Response.prototype.json calls against HTML or non-JSON content
if (typeof Response !== 'undefined' && Response.prototype && !((Response.prototype as any).__isSafeguarded)) {
  const originalJson = Response.prototype.json;
  Response.prototype.json = async function () {
    try {
      return await originalJson.call(this);
    } catch (err: any) {
      console.warn('Muted JSON parse failure. Returning fallback representation.', err);
      return { 
        success: false, 
        error: 'The server did not return a valid JSON response. Please check if the backend is configured correctly.' 
      };
    }
  };
  (Response.prototype as any).__isSafeguarded = true;
}

function getHeaders() {
  const token = localStorage.getItem('studybot_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Interceptor for handling access token expiration recursively
async function fetchWithTokenRefresh(url: string, init?: RequestInit): Promise<Response> {
  let res = await fetch(url, init);

  if (res.status === 401) {
    const clone = res.clone();
    try {
      const data = await clone.json();
      if (data.isTokenExpired || data.error === 'AccessTokenExpired') {
        const refreshed = await api.refreshToken();
        if (refreshed) {
          const newInit = { ...init };
          newInit.headers = getHeaders();
          res = await fetch(url, newInit);
        }
      }
    } catch (e) {
      // JSON read issue, ignore and return original status
    }
  }
  return res;
}

export const api = {
  // Authentication
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.success) {
      if (data.token) localStorage.setItem('studybot_token', data.token);
      if (data.refreshToken) localStorage.setItem('studybot_refresh_token', data.refreshToken);
    }
    return data;
  },

  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    const data = await res.json();
    if (data.success) {
      if (data.token) localStorage.setItem('studybot_token', data.token);
      if (data.refreshToken) localStorage.setItem('studybot_refresh_token', data.refreshToken);
    }
    return data;
  },

  async getMe() {
    const token = localStorage.getItem('studybot_token');
    if (!token) return { success: false, error: 'No token found' };
    
    try {
      const res = await fetchWithTokenRefresh(`${API_BASE}/auth/me`, {
        headers: getHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: 'Network error or token expired' };
    }
  },

  async refreshToken(): Promise<boolean> {
    const rToken = localStorage.getItem('studybot_refresh_token');
    if (!rToken) return false;
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: rToken })
      });
      const data = await response.json();
      if (data.success && data.token) {
        localStorage.setItem('studybot_token', data.token);
        return true;
      } else {
        api.logout();
        return false;
      }
    } catch (err) {
      return false;
    }
  },

  logout() {
    localStorage.removeItem('studybot_token');
    localStorage.removeItem('studybot_refresh_token');
  },

  async otpSend(userId?: string, email?: string) {
    const res = await fetch(`${API_BASE}/auth/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, email })
    });
    return await res.json();
  },

  async otpVerify(userId: string, otp: string) {
    const res = await fetch(`${API_BASE}/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, otp })
    });
    const data = await res.json();
    if (data.success && data.token) {
      localStorage.setItem('studybot_token', data.token);
    }
    return data;
  },

  // Sessions
  async getSessions() {
    const res = await fetchWithTokenRefresh(`${API_BASE}/chat/sessions`, {
      headers: getHeaders()
    });
    return await res.json();
  },

  async createSession(title?: string) {
    const res = await fetchWithTokenRefresh(`${API_BASE}/chat/session/create`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ title })
    });
    return await res.json();
  },

  async deleteSession(sessionId: string) {
    const res = await fetchWithTokenRefresh(`${API_BASE}/chat/session/delete`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ sessionId })
    });
    return await res.json();
  },

  // Chats
  async sendMessage(
    sessionId: string, 
    content: string, 
    attachedImage?: string, 
    attachedFile?: { name: string; type: string; base64: string },
    enableWebSearch?: boolean
  ) {
    const res = await fetchWithTokenRefresh(`${API_BASE}/chat`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ sessionId, content, attachedImage, attachedFile, enableWebSearch })
    });
    return await res.json();
  },

  // OCR solve picture
  async solveImage(attachedImage: string, question?: string) {
    const res = await fetchWithTokenRefresh(`${API_BASE}/upload-image`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ attachedImage, question })
    });
    return await res.json();
  },

  // Admin section
  async adminGetUsers() {
    const res = await fetchWithTokenRefresh(`${API_BASE}/admin/users`, {
      headers: getHeaders()
    });
    return await res.json();
  },

  async adminToggleBan(userId: string) {
    const res = await fetchWithTokenRefresh(`${API_BASE}/admin/users/toggle-ban`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ userId })
    });
    return await res.json();
  },

  async adminUpdateQuota(userId: string, count: number) {
    const res = await fetchWithTokenRefresh(`${API_BASE}/admin/users/update-quota`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ userId, dailyMessagesCount: count })
    });
    return await res.json();
  },

  async adminUpdateRole(userId: string, role: string) {
    const res = await fetchWithTokenRefresh(`${API_BASE}/admin/users/update-role`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ userId, role })
    });
    return await res.json();
  },

  async adminUpdatePlan(userId: string, plan: 'free' | 'basic' | 'pro') {
    const res = await fetchWithTokenRefresh(`${API_BASE}/admin/users/update-plan`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ userId, plan })
    });
    return await res.json();
  },

  async adminDeleteUser(userId: string) {
    const res = await fetchWithTokenRefresh(`${API_BASE}/admin/users/delete`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ userId })
    });
    return await res.json();
  },

  async adminUpdateVerification(userId: string, isVerified: boolean) {
    const res = await fetchWithTokenRefresh(`${API_BASE}/admin/users/update-verification`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ userId, isVerified })
    });
    return await res.json();
  },

  async adminGetChats() {
    const res = await fetchWithTokenRefresh(`${API_BASE}/admin/chats`, {
      headers: getHeaders()
    });
    return await res.json();
  },

  async adminDeleteMessage(sessionId: string, messageId: string) {
    const res = await fetchWithTokenRefresh(`${API_BASE}/admin/chats/delete-message`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ sessionId, messageId })
    });
    return await res.json();
  },

  async adminDeleteSession(sessionId: string) {
    const res = await fetchWithTokenRefresh(`${API_BASE}/admin/chats/delete-session`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ sessionId })
    });
    return await res.json();
  },

  async userUpdatePlan(plan: 'free' | 'basic' | 'pro') {
    const res = await fetchWithTokenRefresh(`${API_BASE}/user/update-plan`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ plan })
    });
    return await res.json();
  },

  async adminGetSettings() {
    const res = await fetchWithTokenRefresh(`${API_BASE}/admin/settings`, {
      headers: getHeaders()
    });
    return await res.json();
  },

  async adminUpdateSettings(settingsPayload: {
    systemPrompt?: string;
    enableImageAI?: boolean;
    enableVoiceAI?: boolean;
    enableOTPVerification?: boolean;
    dailyLimitPerUser?: number;
    chatbotTone?: string;
    freePlanLimit?: number;
    basicPlanLimit?: number;
    proPlanLimit?: number;
    enableImageFree?: boolean;
    enableImageBasic?: boolean;
    enableImagePro?: boolean;
    enableFileFree?: boolean;
    enableFileBasic?: boolean;
    enableFilePro?: boolean;
  }) {
    const res = await fetchWithTokenRefresh(`${API_BASE}/admin/settings`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(settingsPayload)
    });
    return await res.json();
  },

  async adminGetStats() {
    const res = await fetchWithTokenRefresh(`${API_BASE}/admin/stats`, {
      headers: getHeaders()
    });
    return await res.json();
  },

  // --- BOOK STORE & ONLINE LIBRARY ---
  async getBooks() {
    const res = await fetchWithTokenRefresh(`${API_BASE}/books`, {
      headers: getHeaders()
    });
    return await res.json();
  },

  async getMyBooks() {
    const res = await fetchWithTokenRefresh(`${API_BASE}/books/my`, {
      headers: getHeaders()
    });
    return await res.json();
  },

  async buyBook(bookId: string) {
    const res = await fetchWithTokenRefresh(`${API_BASE}/books/buy`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ bookId })
    });
    return await res.json();
  },

  async adminAddBook(bookPayload: {
    title: string;
    author: string;
    price: number;
    description: string;
    category: string;
    downloadUrl?: string;
    totalPages?: number;
    coverUrl?: string;
  }) {
    const res = await fetchWithTokenRefresh(`${API_BASE}/books/add`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(bookPayload)
    });
    return await res.json();
  },

  async adminUpdateBook(id: string, bookPayload: Partial<any>) {
    const res = await fetchWithTokenRefresh(`${API_BASE}/books/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(bookPayload)
    });
    return await res.json();
  },

  async adminDeleteBook(id: string) {
    const res = await fetchWithTokenRefresh(`${API_BASE}/books/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return await res.json();
  },

  async adminGetPurchases() {
    const res = await fetchWithTokenRefresh(`${API_BASE}/books/purchases/all`, {
      headers: getHeaders()
    });
    return await res.json();
  },

  // --- CUSTOM DYNAMIC PAGES & MEDIA LIBRARY ---
  async getPages() {
    const res = await fetchWithTokenRefresh(`${API_BASE}/pages`, {
      headers: getHeaders()
    });
    return await res.json();
  },

  async getPageBySlug(slug: string) {
    const res = await fetchWithTokenRefresh(`${API_BASE}/pages/${slug}`, {
      headers: getHeaders()
    });
    return await res.json();
  },

  async adminCreatePage(pagePayload: { title: string; slug: string; content: string; visible: boolean; isHtml?: boolean }) {
    const res = await fetchWithTokenRefresh(`${API_BASE}/admin/pages`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(pagePayload)
    });
    return await res.json();
  },

  async adminUpdatePage(id: string, pagePayload: { title?: string; slug?: string; content?: string; visible?: boolean; isHtml?: boolean }) {
    const res = await fetchWithTokenRefresh(`${API_BASE}/admin/pages/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(pagePayload)
    });
    return await res.json();
  },

  async adminDeletePage(id: string) {
    const res = await fetchWithTokenRefresh(`${API_BASE}/admin/pages/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return await res.json();
  },

  async adminGetMedia() {
    const res = await fetchWithTokenRefresh(`${API_BASE}/admin/media`, {
      headers: getHeaders()
    });
    return await res.json();
  },

  async adminAddMedia(mediaPayload: { name: string; type: string; size: number; base64: string }) {
    const res = await fetchWithTokenRefresh(`${API_BASE}/admin/media`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(mediaPayload)
    });
    return await res.json();
  },

  async adminDeleteMedia(id: string) {
    const res = await fetchWithTokenRefresh(`${API_BASE}/admin/media/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return await res.json();
  },

  // --- NAVIGATION MENUS AND SUBMENUS ---
  async getNavigationMenus() {
    const res = await fetchWithTokenRefresh(`${API_BASE}/menus`, {
      headers: getHeaders()
    });
    return await res.json();
  },

  async adminCreateNavigationMenu(menuPayload: { label: string; link: string; order: number; parentId?: string }) {
    const res = await fetchWithTokenRefresh(`${API_BASE}/admin/menus`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(menuPayload)
    });
    return await res.json();
  },

  async adminUpdateNavigationMenu(id: string, menuPayload: { label?: string; link?: string; order?: number; parentId?: string }) {
    const res = await fetchWithTokenRefresh(`${API_BASE}/admin/menus/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(menuPayload)
    });
    return await res.json();
  },

  async adminDeleteNavigationMenu(id: string) {
    const res = await fetchWithTokenRefresh(`${API_BASE}/admin/menus/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return await res.json();
  },

  // --- PASSWORD MANAGEMENT ---
  async adminChangePassword(payload: { userId: string; newPassword?: string }) {
    const res = await fetchWithTokenRefresh(`${API_BASE}/admin/users/change-password`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return await res.json();
  }
};
