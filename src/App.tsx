import { useState, useEffect, useCallback } from 'react';
import { Plus, GraduationCap, Search, Loader2, WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { type Essay } from './types';
import { api } from './api';
import EssayTable from './components/EssayTable';
import AddEssayModal from './components/AddEssayModal';
import EssayViewModal from './components/EssayViewModal';
import StatsBar from './components/StatsBar';

export default function App() {
  const [essays, setEssays] = useState<Essay[]>([]);
  const [loading, setLoading] = useState(true);
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEssay, setEditingEssay] = useState<Essay | null>(null);
  const [viewingEssay, setViewingEssay] = useState<Essay | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadEssays = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getAll();
      setEssays(data);
      // Проверяем, работает ли сервер
      try {
        const res = await fetch('/api/essays', { signal: AbortSignal.timeout(1000) });
        setServerOnline(res.ok);
      } catch {
        setServerOnline(false);
      }
    } catch (err) {
      console.error('Failed to load essays:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEssays();
  }, [loadEssays]);

  const filteredEssays = essays.filter(
    (essay) =>
      essay.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      essay.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddEssay = async (essayData: Omit<Essay, 'id'>) => {
    try {
      if (editingEssay) {
        const updated = await api.update(editingEssay.id, essayData);
        setEssays((prev) => prev.map((e) => (e.id === editingEssay.id ? updated : e)));
        setEditingEssay(null);
      } else {
        const created = await api.create(essayData);
        setEssays((prev) => [...prev, created]);
      }
    } catch (err) {
      console.error('Failed to save essay:', err);
    }
  };

  const handleEdit = (essay: Essay) => {
    setEditingEssay(essay);
    setIsAddModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (deleteConfirm === id) {
      try {
        await api.delete(id);
        setEssays((prev) => prev.filter((e) => e.id !== id));
        setDeleteConfirm(null);
      } catch (err) {
        console.error('Failed to delete essay:', err);
      }
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setEditingEssay(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-indigo-500" />
          <p className="mt-4 text-sm text-slate-500">Загрузка эссе...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-200">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-slate-800">
                  English Essay Tracker
                </h1>
                {/* Server status indicator */}
                {serverOnline !== null && (
                  <span
                    className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      serverOnline
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                    title={serverOnline ? 'Сервер подключён' : 'Сервер недоступен — используется localStorage'}
                  >
                    {serverOnline ? (
                      <>
                        <Wifi className="h-2.5 w-2.5" />
                        Сервер
                      </>
                    ) : (
                      <>
                        <WifiOff className="h-2.5 w-2.5" />
                        Локально
                      </>
                    )}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">Статистика ошибок в эссе</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadEssays}
              className="rounded-xl p-2.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              title="Обновить данные"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setEditingEssay(null);
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:shadow-xl hover:shadow-indigo-300 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Добавить эссе
            </button>
          </div>
        </div>
      </header>

      {/* Server offline banner */}
      {serverOnline === false && (
        <div className="border-b border-amber-200 bg-amber-50 px-6 py-2">
          <div className="mx-auto flex max-w-[1400px] items-center gap-2 text-xs text-amber-700">
            <WifiOff className="h-3.5 w-3.5 flex-shrink-0" />
            <span>
              Сервер не запущен — данные сохраняются локально. Запустите{' '}
              <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono font-semibold">
                node server.js
              </code>{' '}
              для серверного хранения.
            </span>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="mx-auto max-w-[1400px] px-6 py-6">
        {/* Stats */}
        <div className="mb-6">
          <StatsBar essays={essays} />
        </div>

        {/* Search */}
        <div className="mb-4 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по теме или тексту эссе..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 placeholder-slate-400 transition-all focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          {searchQuery && (
            <span className="text-sm text-slate-400">
              Найдено: {filteredEssays.length} из {essays.length}
            </span>
          )}
        </div>

        {/* Delete confirmation overlay */}
        {deleteConfirm && (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <span className="text-sm text-red-700">
              Нажмите «Удалить» ещё раз для подтверждения
            </span>
            <button
              onClick={() => setDeleteConfirm(null)}
              className="text-sm text-red-500 hover:text-red-700"
            >
              Отмена
            </button>
          </div>
        )}

        {/* Table */}
        <EssayTable
          essays={filteredEssays}
          onView={setViewingEssay}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </main>

      {/* Modals */}
      <AddEssayModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        onSave={handleAddEssay}
        editEssay={editingEssay}
      />
      <EssayViewModal essay={viewingEssay} onClose={() => setViewingEssay(null)} />
    </div>
  );
}
