import { useState } from 'react';
import { Eye, Pencil, Trash2, ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react';
import { ERROR_TYPES, type Essay } from '../types';

interface EssayTableProps {
  essays: Essay[];
  onView: (essay: Essay) => void;
  onEdit: (essay: Essay) => void;
  onDelete: (id: string) => void;
}

type SortField = 'date' | 'topic' | 'totalErrors' | string;
type SortDir = 'asc' | 'desc';

export default function EssayTable({ essays, onView, onEdit, onDelete }: EssayTableProps) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [hoveredCell, setHoveredCell] = useState<{ essayId: string; errorType: string } | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const getErrorCount = (essay: Essay, errorType: string) => {
    const err = essay.errors.find((e) => e.type === errorType);
    return err ? err.examples.length : 0;
  };

  const getErrorExamples = (essay: Essay, errorType: string): string[] => {
    const err = essay.errors.find((e) => e.type === errorType);
    return err ? err.examples : [];
  };

  const getTotalErrors = (essay: Essay) =>
    essay.errors.reduce((sum, e) => sum + e.examples.length, 0);

  const sortedEssays = [...essays].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'date') {
      cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
    } else if (sortField === 'topic') {
      cmp = a.topic.localeCompare(b.topic);
    } else if (sortField === 'totalErrors') {
      cmp = getTotalErrors(a) - getTotalErrors(b);
    } else {
      cmp = getErrorCount(a, sortField) - getErrorCount(b, sortField);
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 opacity-30" />;
    return sortDir === 'asc' ? (
      <ChevronUp className="h-3 w-3" />
    ) : (
      <ChevronDown className="h-3 w-3" />
    );
  };

  if (essays.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-8 py-20">
        <div className="mb-4 text-6xl">📝</div>
        <h3 className="mb-2 text-lg font-semibold text-slate-700">Пока нет ни одного эссе</h3>
        <p className="max-w-md text-center text-sm text-slate-400">
          Добавьте своё первое эссе, чтобы начать отслеживать прогресс в изучении английского языка
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80">
            {/* Date */}
            <th
              className="cursor-pointer whitespace-nowrap px-4 py-3 text-left font-semibold text-slate-600 transition-colors hover:bg-slate-100"
              onClick={() => handleSort('date')}
            >
              <div className="flex items-center gap-1">
                Дата
                <SortIcon field="date" />
              </div>
            </th>

            {/* Topic */}
            <th
              className="cursor-pointer whitespace-nowrap px-4 py-3 text-left font-semibold text-slate-600 transition-colors hover:bg-slate-100"
              onClick={() => handleSort('topic')}
            >
              <div className="flex items-center gap-1">
                Тема
                <SortIcon field="topic" />
              </div>
            </th>

            {/* Error type columns */}
            {ERROR_TYPES.map(({ key, label, headerColor }) => (
              <th
                key={key}
                className={`cursor-pointer whitespace-nowrap px-3 py-3 text-center font-semibold transition-colors hover:brightness-95 ${headerColor}`}
                onClick={() => handleSort(key)}
              >
                <div className="flex items-center justify-center gap-1">
                  {label}
                  <SortIcon field={key} />
                </div>
              </th>
            ))}

            {/* Total */}
            <th
              className="cursor-pointer whitespace-nowrap px-4 py-3 text-center font-semibold text-slate-600 transition-colors hover:bg-slate-100"
              onClick={() => handleSort('totalErrors')}
            >
              <div className="flex items-center justify-center gap-1">
                Итого
                <SortIcon field="totalErrors" />
              </div>
            </th>

            {/* Actions */}
            <th className="px-4 py-3 text-center font-semibold text-slate-400">Действия</th>
          </tr>
        </thead>
        <tbody>
          {sortedEssays.map((essay, idx) => {
            const total = getTotalErrors(essay);
            return (
              <tr
                key={essay.id}
                className={`border-b border-slate-100 transition-colors hover:bg-indigo-50/30 ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                }`}
              >
                {/* Date */}
                <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                  {new Date(essay.date).toLocaleDateString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit',
                  })}
                </td>

                {/* Topic */}
                <td className="max-w-[250px] px-4 py-3">
                  <button
                    onClick={() => onView(essay)}
                    className="group flex items-center gap-2 text-left"
                  >
                    <Eye className="h-4 w-4 flex-shrink-0 text-indigo-400 opacity-0 transition-opacity group-hover:opacity-100" />
                    <span className="truncate font-medium text-slate-800 group-hover:text-indigo-600">
                      {essay.topic}
                    </span>
                  </button>
                </td>

                {/* Error cells */}
                {ERROR_TYPES.map(({ key, color, dotColor }) => {
                  const count = getErrorCount(essay, key);
                  const examples = getErrorExamples(essay, key);
                  const isHovered =
                    hoveredCell?.essayId === essay.id && hoveredCell?.errorType === key;

                  return (
                    <td
                      key={key}
                      className="relative px-3 py-3 text-center"
                      onMouseEnter={() => setHoveredCell({ essayId: essay.id, errorType: key })}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      {count > 0 ? (
                        <span
                          className={`inline-flex h-7 min-w-[28px] items-center justify-center rounded-full px-2 text-xs font-bold ${color}`}
                        >
                          {count}
                        </span>
                      ) : (
                        <span className="text-slate-200">—</span>
                      )}

                      {/* Tooltip */}
                      {isHovered && examples.length > 0 && (
                        <div className="absolute left-1/2 top-full z-50 mt-1 w-72 -translate-x-1/2 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                          <div className="mb-2 flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${dotColor}`} />
                            <span className="text-xs font-bold text-slate-600">
                              {ERROR_TYPES.find((t) => t.key === key)?.label} — примеры
                            </span>
                          </div>
                          <ul className="space-y-1.5">
                            {examples.slice(0, 5).map((ex, i) => (
                              <li key={i} className="text-xs text-slate-600">
                                <span className="mr-1 text-slate-400">{i + 1}.</span>
                                <span className="font-mono">{ex}</span>
                              </li>
                            ))}
                            {examples.length > 5 && (
                              <li className="text-xs text-slate-400">
                                ...и ещё {examples.length - 5}
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                    </td>
                  );
                })}

                {/* Total */}
                <td className="px-4 py-3 text-center">
                  {total > 0 ? (
                    <span
                      className={`inline-flex h-7 min-w-[28px] items-center justify-center rounded-full px-2 text-xs font-bold ${
                        total >= 10
                          ? 'bg-red-100 text-red-700'
                          : total >= 5
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {total}
                    </span>
                  ) : (
                    <span className="text-emerald-400">✓</span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => onView(essay)}
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                      title="Просмотреть"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onEdit(essay)}
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-600"
                      title="Редактировать"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(essay.id)}
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      title="Удалить"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
