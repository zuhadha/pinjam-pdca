'use client'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { RoomDashboard } from '@/lib/rooms/dashboard'

// Same hues as the item dashboard, in an order checked for colour-blind separation;
// grey is kept for the "Lainnya" slice
const PIE_COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981']
const OTHER_COLOR = '#94a3b8'
const TOOLTIP_STYLE = { borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }

/** Sequential blue scale for the heatmap: empty cells stay white, the busiest cell is darkest. */
function heatColor(value: number, max: number) {
  if (!value || !max) return { background: '#ffffff', color: '#9ca3af' }
  const steps = ['#eff6ff', '#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8']
  const i = Math.min(steps.length - 1, Math.ceil((value / max) * steps.length) - 1)
  return { background: steps[i], color: i >= 5 ? '#ffffff' : '#1e3a8a' }
}

function Leaderboard({ items, unit, empty }: { items: { name: string; value: number }[]; unit: string; empty: string }) {
  return (
    <div className="mt-2 flex flex-col gap-4">
      {items.length > 0 ? (
        items.map((item, index) => (
          <div
            key={item.name}
            className="flex items-center rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition-transform hover:-translate-y-1"
          >
            <div
              className={`mr-3 flex h-10 w-10 items-center justify-center rounded-full text-lg font-extrabold text-white shadow-inner ${
                index === 0
                  ? 'bg-gradient-to-br from-yellow-300 to-amber-500'
                  : index === 1
                    ? 'bg-gradient-to-br from-gray-300 to-slate-400'
                    : 'bg-gradient-to-br from-orange-300 to-amber-700'
              }`}
            >
              {index + 1}
            </div>
            <div className="flex-1 overflow-hidden">
              <h4 className="truncate text-sm font-bold text-gray-900">{item.name}</h4>
              <div className="mt-0.5 text-xs font-medium text-gray-500">
                {item.value} {unit}
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="py-10 text-center text-sm text-gray-500">{empty}</div>
      )}
    </div>
  )
}

export function RoomDashboardCharts({ data }: { data: RoomDashboard }) {
  const { periodLabel, trendData, trendDescription, topRooms, topDepartments, roomShare, heatmap } = data
  const shareTotal = roomShare.reduce((sum, r) => sum + r.value, 0)

  return (
    <div className="flex flex-col gap-6">
      {/* ROW 1: trend + top rooms */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-gray-800">Tren Booking Ruangan</CardTitle>
            <CardDescription>
              {trendDescription}
              <span className="text-gray-400"> · {periodLabel}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mt-4 h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="roomTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} tickMargin={10} minTickGap={20} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
                  <Tooltip
                    cursor={{ stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '4 4' }}
                    contentStyle={TOOLTIP_STYLE}
                    labelFormatter={(label, payload) => {
                      const range = payload?.[0]?.payload?.range
                      return range && range !== label ? `${label} · ${range}` : label
                    }}
                    formatter={(value) => [value, 'Booking']}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#roomTrend)"
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 border-amber-200 bg-gradient-to-b from-amber-50/50 to-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">🏆 Top 3 Ruangan</CardTitle>
            <CardDescription>Ruangan paling sering dibooking {periodLabel}</CardDescription>
          </CardHeader>
          <CardContent>
            <Leaderboard items={topRooms} unit="booking" empty="Belum ada data" />
          </CardContent>
        </Card>
      </div>

      {/* ROW 2: departments + room share */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Top 3 Departemen Teraktif</CardTitle>
            <CardDescription>Departemen dengan booking terbanyak · {periodLabel}</CardDescription>
          </CardHeader>
          <CardContent>
            {topDepartments.length ? (
              <div className="mt-2 h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topDepartments} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                    <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} hide />
                    <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} fontSize={12} width={110} />
                    <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={TOOLTIP_STYLE} formatter={(value) => [value, 'Booking']} />
                    <Bar
                      dataKey="value"
                      fill="#3b82f6"
                      radius={[0, 4, 4, 0]}
                      maxBarSize={30}
                      label={{ position: 'right', fontSize: 12, fill: '#6b7280' }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-16 text-center text-sm text-gray-500">Belum ada data</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Ruangan Terpopuler</CardTitle>
            <CardDescription>Bagian dari semua booking · {periodLabel}</CardDescription>
          </CardHeader>
          <CardContent>
            {roomShare.length ? (
              <>
              <div className="h-[210px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roomShare}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      stroke="#ffffff"
                      strokeWidth={2}
                      label={({ value }) => `${Math.round(((value as number) / shareTotal) * 100)}%`}
                      labelLine={false}
                      fontSize={12}
                    >
                      {roomShare.map((entry, index) => (
                        <Cell key={entry.name} fill={entry.name === 'Lainnya' ? OTHER_COLOR : PIE_COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value, name) => [`${value} booking`, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legend in ranking order, with the counts */}
              <ul className="mt-2 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
                {roomShare.map((r, index) => (
                  <li key={r.name} className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: r.name === 'Lainnya' ? OTHER_COLOR : PIE_COLORS[index] }}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 truncate text-gray-700">{r.name}</span>
                    <span className="tabular-nums text-gray-900">{r.value}</span>
                    <span className="w-10 text-right tabular-nums text-gray-500">{Math.round((r.value / shareTotal) * 100)}%</span>
                  </li>
                ))}
              </ul>
              </>
            ) : (
              <div className="py-16 text-center text-sm text-gray-500">Belum ada data</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ROW 3: heatmap of busy hours per room */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">Jam Tersibuk per Ruangan</CardTitle>
          <CardDescription>Jumlah booking yang memakai tiap jam · {periodLabel}</CardDescription>
        </CardHeader>
        <CardContent>
          {heatmap.rooms.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] table-fixed border-separate text-sm" style={{ borderSpacing: 2 }}>
                <colgroup>
                  <col className="w-16" />
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col" />
                    {heatmap.rooms.map((r) => (
                      <th key={r} scope="col" className="truncate px-1 pb-1 text-center text-xs font-medium text-gray-600" title={r}>
                        {r}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {heatmap.hours.map((h, i) => (
                    <tr key={h}>
                      <th scope="row" className="pr-2 text-right text-xs font-normal tabular-nums text-gray-500">
                        {String(h).padStart(2, '0')}:00
                      </th>
                      {heatmap.cells[i].map((v, j) => {
                        const c = heatColor(v, heatmap.max)
                        return (
                          <td
                            key={j}
                            title={`${heatmap.rooms[j]}, ${String(h).padStart(2, '0')}:00–${String(h + 1).padStart(2, '0')}:00: ${v} booking`}
                            className="h-9 rounded text-center text-xs font-medium tabular-nums"
                            style={{ background: c.background, color: c.color, boxShadow: v ? undefined : 'inset 0 0 0 1px #f3f4f6' }}
                          >
                            {v || ''}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                <span>Sepi</span>
                {['#eff6ff', '#bfdbfe', '#60a5fa', '#2563eb', '#1d4ed8'].map((c) => (
                  <span key={c} className="h-3 w-6 rounded-sm" style={{ background: c }} aria-hidden />
                ))}
                <span>Ramai</span>
                {heatmap.max > 0 && <span className="ml-2 tabular-nums">(maks {heatmap.max} booking)</span>}
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-sm text-gray-500">Belum ada ruangan</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
