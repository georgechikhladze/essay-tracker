import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { type Essay } from '../types';

interface ErrorsChartProps {
  essays: Essay[];
}

export default function ErrorsChart({ essays }: ErrorsChartProps) {
  // Подготавливаем данные: сортируем по датам и считаем ошибки
  const chartData = [...essays]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((essay) => {
      const errorCount = essay.errors.reduce((sum, err) => sum + err.examples.length, 0);
      return {
        date: new Date(essay.date).toLocaleDateString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
        }),
        fullDate: essay.date,
        errors: errorCount,
        topic: essay.topic,
      };
    });

  if (essays.length < 2) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Изменение ошибок по датам
        </h3>
        <div className="flex items-center justify-center rounded-xl bg-slate-50 py-12">
          <p className="text-sm text-slate-500">
            Добавьте минимум 2 эссе для отображения графика
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
        Изменение ошибок по датам
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorErrors" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="date" 
            stroke="#94a3b8"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#94a3b8"
            style={{ fontSize: '12px' }}
            label={{ value: 'Количество ошибок', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}
            formatter={(value) => [`${value} ошибок`, 'Ошибки']}
            labelFormatter={(label) => `Дата: ${label}`}
          />
          <Area
            type="monotone"
            dataKey="errors"
            stroke="#f97316"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorErrors)"
            isAnimationActive={true}
            dot={{ fill: '#f97316', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend with essay topics */}
      {chartData.length > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-200">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            По датам
          </p>
          <div className="space-y-2">
            {chartData.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="h-2 w-2 rounded-full bg-orange-500 flex-shrink-0" />
                  <span className="text-slate-600 truncate">{item.date}</span>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0 ml-2">
                  <span className="text-slate-500">{item.topic}</span>
                  <span className="font-semibold text-slate-700 w-8 text-right">{item.errors}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
