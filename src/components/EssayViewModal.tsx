import { X, Calendar, AlertTriangle } from 'lucide-react';
import { ERROR_TYPES, type Essay } from '../types';

interface EssayViewModalProps {
  essay: Essay | null;
  onClose: () => void;
}

export default function EssayViewModal({ essay, onClose }: EssayViewModalProps) {
  if (!essay) return null;

  const totalErrors = essay.errors.reduce((sum, err) => sum + err.examples.length, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-slate-200 bg-white px-6 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-bold text-slate-800">{essay.topic}</h2>
            <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(essay.date).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              <span className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {totalErrors} {totalErrors === 1 ? 'ошибка' : totalErrors < 5 ? 'ошибки' : 'ошибок'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-4 flex-shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Essay text */}
          <div className="mb-6">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
              Текст эссе
            </h3>
            <div className="whitespace-pre-wrap rounded-xl bg-slate-50 p-5 font-mono text-sm leading-relaxed text-slate-700">
              {essay.text}
            </div>
          </div>

          {/* Errors */}
          {essay.errors.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
                Найденные ошибки
              </h3>
              <div className="space-y-3">
                {essay.errors.map((err) => {
                  const errorType = ERROR_TYPES.find((t) => t.key === err.type);
                  if (!errorType) return null;
                  return (
                    <div
                      key={err.type}
                      className={`rounded-xl border p-4 ${errorType.color} border-current/20`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-bold">{errorType.label}</span>
                        <span className="rounded-full bg-white/70 px-2.5 py-0.5 text-xs font-bold">
                          {err.examples.length}
                        </span>
                      </div>
                      <ul className="space-y-1.5">
                        {err.examples.map((example, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 rounded-lg bg-white/50 px-3 py-2 text-sm"
                          >
                            <span className="mt-0.5 flex-shrink-0 text-current/50">
                              {idx + 1}.
                            </span>
                            <span className="font-mono">{example}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {essay.errors.length === 0 && (
            <div className="rounded-xl bg-emerald-50 p-6 text-center">
              <span className="text-4xl">🎉</span>
              <p className="mt-2 text-sm font-medium text-emerald-700">
                Ошибки не зафиксированы — отличная работа!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
