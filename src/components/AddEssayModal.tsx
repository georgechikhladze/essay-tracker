import { useState, useEffect } from 'react';
import { X, Plus, Trash2, FileText } from 'lucide-react';
import { ERROR_TYPES, type Essay, type EssayError, type ErrorTypeKey } from '../types';

interface AddEssayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (essay: Omit<Essay, 'id'>) => void;
  editEssay?: Essay | null;
}

export default function AddEssayModal({ isOpen, onClose, onSave, editEssay }: AddEssayModalProps) {
  const [topic, setTopic] = useState('');
  const [text, setText] = useState('');
  const [errors, setErrors] = useState<Record<ErrorTypeKey, string[]>>({
    articles: [''],
    grammar: [''],
    stylistic: [''],
    vocabulary: [''],
    punctuation: [''],
    spelling: [''],
    prepositions: [''],
    wordOrder: [''],
    tenses: [''],
  });

  useEffect(() => {
    if (editEssay) {
      setTopic(editEssay.topic);
      setText(editEssay.text);
      const errorMap: Record<ErrorTypeKey, string[]> = {
        articles: [''], grammar: [''], stylistic: [''], vocabulary: [''],
        punctuation: [''], spelling: [''], prepositions: [''], wordOrder: [''], tenses: [''],
      };
      editEssay.errors.forEach((err) => {
        errorMap[err.type] = err.examples.length > 0 ? [...err.examples] : [''];
      });
      setErrors(errorMap);
    } else {
      setTopic('');
      setText('');
      setErrors({
        articles: [''], grammar: [''], stylistic: [''], vocabulary: [''],
        punctuation: [''], spelling: [''], prepositions: [''], wordOrder: [''], tenses: [''],
      });
    }
  }, [editEssay, isOpen]);

  if (!isOpen) return null;

  const addExample = (type: ErrorTypeKey) => {
    setErrors((prev) => ({ ...prev, [type]: [...prev[type], ''] }));
  };

  const removeExample = (type: ErrorTypeKey, index: number) => {
    setErrors((prev) => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }));
  };

  const updateExample = (type: ErrorTypeKey, index: number, value: string) => {
    setErrors((prev) => ({
      ...prev,
      [type]: prev[type].map((ex, i) => (i === index ? value : ex)),
    }));
  };

  const handleSave = () => {
    if (!topic.trim() || !text.trim()) return;

    const essayErrors: EssayError[] = ERROR_TYPES.map(({ key }) => ({
      type: key,
      examples: errors[key].filter((ex) => ex.trim() !== ''),
    })).filter((err) => err.examples.length > 0);

    onSave({
      topic: topic.trim(),
      text: text.trim(),
      date: editEssay ? editEssay.date : new Date().toISOString(),
      errors: essayErrors,
    });
    onClose();
  };

  const totalErrors = Object.values(errors).reduce(
    (sum, examples) => sum + examples.filter((ex) => ex.trim() !== '').length,
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">
              {editEssay ? 'Редактировать эссе' : 'Новое эссе'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 p-6">
          {/* Topic */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Тема эссе <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Например: The Impact of Technology on Education"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 placeholder-slate-400 transition-all focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Essay text */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Текст эссе <span className="text-red-400">*</span>
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Вставьте полный текст вашего эссе..."
              rows={8}
              className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 font-mono text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
            <p className="mt-1 text-xs text-slate-400">
              {text.length} символов · {text.split(/\s+/).filter(Boolean).length} слов
            </p>
          </div>

          {/* Errors section */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">Типовые ошибки</h3>
              <span className="rounded-full bg-indigo-100 px-3 py-0.5 text-xs font-medium text-indigo-700">
                {totalErrors} {totalErrors === 1 ? 'пример' : totalErrors < 5 ? 'примера' : 'примеров'}
              </span>
            </div>

            <div className="space-y-3">
              {ERROR_TYPES.map(({ key, label, color }) => {
                const examples = errors[key];
                const filledCount = examples.filter((ex) => ex.trim() !== '').length;
                return (
                  <div
                    key={key}
                    className={`rounded-xl border p-4 transition-all ${
                      filledCount > 0 ? `${color} border-current/20` : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-semibold">{label}</span>
                      {filledCount > 0 && (
                        <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-bold">
                          {filledCount}
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {examples.map((example, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input
                            type="text"
                            value={example}
                            onChange={(e) => updateExample(key, idx, e.target.value)}
                            placeholder={`Пример ошибки ${idx + 1}...`}
                            className="flex-1 rounded-lg border border-current/20 bg-white/80 px-3 py-2 text-sm placeholder-current/40 focus:bg-white focus:outline-none focus:ring-1 focus:ring-current/30"
                          />
                          {examples.length > 1 && (
                            <button
                              onClick={() => removeExample(key, idx)}
                              className="rounded-lg p-2 text-current/50 transition-colors hover:bg-white/50 hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={() => addExample(key)}
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-current/70 transition-colors hover:bg-white/40"
                      >
                        <Plus className="h-3 w-3" />
                        Добавить пример
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-end gap-3 rounded-b-2xl border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-xl px-5 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={!topic.trim() || !text.trim()}
            className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:shadow-xl hover:shadow-indigo-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            {editEssay ? 'Сохранить' : 'Добавить эссе'}
          </button>
        </div>
      </div>
    </div>
  );
}
