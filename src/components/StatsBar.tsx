import { ERROR_TYPES, type Essay } from '../types';
import { TrendingDown, TrendingUp, Minus, BookOpen, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface StatsBarProps {
  essays: Essay[];
}

export default function StatsBar({ essays }: StatsBarProps) {
  const totalEssays = essays.length;
  const totalErrors = essays.reduce(
    (sum, essay) => sum + essay.errors.reduce((s, e) => s + e.examples.length, 0),
    0
  );
  const avgErrors = totalEssays > 0 ? (totalErrors / totalEssays).toFixed(1) : '0';
  const perfectEssays = essays.filter(
    (e) => e.errors.reduce((s, err) => s + err.examples.length, 0) === 0
  ).length;

  // Error breakdown
  const errorBreakdown = ERROR_TYPES.map(({ key, label, dotColor }) => {
    const count = essays.reduce((sum, essay) => {
      const err = essay.errors.find((e) => e.type === key);
      return sum + (err ? err.examples.length : 0);
    }, 0);
    return { key, label, count, dotColor };
  }).filter((e) => e.count > 0);

  // Trend: compare last 2 essays
  const getTrend = () => {
    if (essays.length < 2) return 'same';
    const sorted = [...essays].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const last = sorted[sorted.length - 1];
    const prev = sorted[sorted.length - 2];
    const lastErrors = last.errors.reduce((s, e) => s + e.examples.length, 0);
    const prevErrors = prev.errors.reduce((s, e) => s + e.examples.length, 0);
    if (lastErrors < prevErrors) return 'down';
    if (lastErrors > prevErrors) return 'up';
    return 'same';
  };

  const trend = getTrend();

  return (
    <div className="space-y-4">
      {/* Main stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400">
            <BookOpen className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Эссе</span>
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-800">{totalEssays}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">Ошибки</span>
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-800">{totalErrors}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400">
            {trend === 'down' ? (
              <TrendingDown className="h-4 w-4 text-emerald-500" />
            ) : trend === 'up' ? (
              <TrendingUp className="h-4 w-4 text-red-500" />
            ) : (
              <Minus className="h-4 w-4 text-slate-400" />
            )}
            <span className="text-xs font-medium uppercase tracking-wider">Среднее</span>
          </div>
          <p className="mt-2 text-3xl font-bold text-slate-800">
            {avgErrors}
            <span className="ml-1 text-sm font-normal text-slate-400">/ эссе</span>
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-medium uppercase tracking-wider">Без ошибок</span>
          </div>
          <p className="mt-2 text-3xl font-bold text-emerald-600">{perfectEssays}</p>
        </div>
      </div>

      {/* Error breakdown bar */}
      {errorBreakdown.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Распределение ошибок
          </h3>
          <div className="flex h-4 overflow-hidden rounded-full bg-slate-100">
            {errorBreakdown.map(({ key, count, dotColor }) => (
              <div
                key={key}
                className={`${dotColor} transition-all`}
                style={{ width: `${(count / totalErrors) * 100}%` }}
                title={`${ERROR_TYPES.find((t) => t.key === key)?.label}: ${count}`}
              />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            {errorBreakdown.map(({ key, label, count, dotColor }) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${dotColor}`} />
                <span className="text-xs text-slate-500">
                  {label}{' '}
                  <span className="font-semibold text-slate-700">
                    {count} ({((count / totalErrors) * 100).toFixed(0)}%)
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
