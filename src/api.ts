import { type Essay, type UserRole } from './types';

const API_URL = '/api/essays';
const AUTH_URL = '/api/auth';
const LS_KEY = 'english-essays-fallback';
const TOKEN_KEY = 'auth-token';
const ROLE_KEY = 'user-role';

// Get authorization header
function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return {};
  return { 'Authorization': `Bearer ${token}` };
}

// Проверяем доступность сервера
async function isServerAvailable(): Promise<boolean> {
  try {
    const res = await fetch(API_URL, {
      signal: AbortSignal.timeout(1000),
      headers: getAuthHeader(),
    });
    // Проверяем что это JSON ответ, не HTML ошибка
    return res.ok && res.headers.get('content-type')?.includes('application/json');
  } catch {
    return false;
  }
}

// Читаем из localStorage (fallback)
function readLocal(): Essay[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  } catch {
    return [];
  }
}

// Пишем в localStorage (fallback)
function writeLocal(essays: Essay[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(essays));
}

export const api = {
  // Login
  async login(username: string, password: string): Promise<{ token: string; username: string; role: UserRole }> {
    const res = await fetch(`${AUTH_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Login failed');
    }
    
    const data = await res.json();
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(ROLE_KEY, data.role || 'user');
    return data;
  },

  // Get user role
  getRole(): UserRole {
    return (localStorage.getItem(ROLE_KEY) as UserRole) || 'user';
  },

  // Verify token
  async verify(): Promise<{ valid: boolean; role?: UserRole }> {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return { valid: false };
    
    try {
      const res = await fetch(`${AUTH_URL}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
      });
      
      if (!res.ok) return { valid: false };
      
      const data = await res.json();
      if (data.valid && data.role) {
        localStorage.setItem(ROLE_KEY, data.role);
        return { valid: true, role: data.role };
      }
      return { valid: res.ok, role: data.role };
    } catch {
      return { valid: false };
    }
  },

  // Logout
  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
  },

  // Получить все эссе
  async getAll(): Promise<Essay[]> {
    if (await isServerAvailable()) {
      try {
        const res = await fetch(API_URL, {
          headers: getAuthHeader(),
        });
        return await res.json();
      } catch {
        // Если ошибка парсинга, используем localStorage
        console.warn('⚠️ Ошибка при загрузке с сервера, используется localStorage');
        return readLocal();
      }
    }
    console.warn('⚠️ Сервер недоступен, используется localStorage');
    return readLocal();
  },

  // Добавить эссе
  async create(essay: Omit<Essay, 'id'>): Promise<Essay> {
    if (await isServerAvailable()) {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(essay),
      });
      return res.json();
    }
    const newEssay: Essay = {
      ...essay,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    };
    const essays = readLocal();
    essays.push(newEssay);
    writeLocal(essays);
    return newEssay;
  },

  // Обновить эссе
  async update(id: string, essay: Partial<Essay>): Promise<Essay> {
    if (await isServerAvailable()) {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(essay),
      });
      return res.json();
    }
    const essays = readLocal();
    const idx = essays.findIndex((e) => e.id === id);
    if (idx !== -1) {
      essays[idx] = { ...essays[idx], ...essay, id };
      writeLocal(essays);
      return essays[idx];
    }
    throw new Error('Essay not found');
  },

  // Удалить эссе
  async delete(id: string): Promise<void> {
    if (await isServerAvailable()) {
      await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });
      return;
    }
    const essays = readLocal().filter((e) => e.id !== id);
    writeLocal(essays);
  },

  // Проверить эссе на ошибки используя Gemini
  async checkEssay(text: string): Promise<Record<string, string[]>> {
    const res = await fetch('/api/check-essay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ text }),
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to check essay');
    }
    
    const data = await res.json();
    return data.errors;
  },
};
