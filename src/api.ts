import { type Essay } from './types';

const API_URL = '/api/essays';
const LS_KEY = 'english-essays-fallback';

// Проверяем доступность сервера
async function isServerAvailable(): Promise<boolean> {
  try {
    const res = await fetch(API_URL, { signal: AbortSignal.timeout(1000) });
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
  // Получить все эссе
  async getAll(): Promise<Essay[]> {
    if (await isServerAvailable()) {
      try {
        const res = await fetch(API_URL);
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      return;
    }
    const essays = readLocal().filter((e) => e.id !== id);
    writeLocal(essays);
  },
};
