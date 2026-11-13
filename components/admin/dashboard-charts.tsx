'use client'

import { useState } from 'react'
import {
  BarChart,
  Bar,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LabelList,
  Legend,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#64748b']
const PUNCTUALITY_COLORS = ['#10b981', '#ef4444'] // Green for On-Time, Red for Late

interface ValueLabelProps {
  x?: number | string
  y?: number | string
  value?: number | string
  bg?: string
  color?: string
}

function ValueLabel({ x, y, value, bg, color }: ValueLabelProps) {
  if (x == null || y == null || value == null) return null
  const cx = Number(x)
  const cy = Number(y)
  const text = String(value)
  const width = text.length * 9 + 12
  const height = 20
  return (
    <g>
      <rect x={cx - width / 2} y={cy - height / 2} width={width} height={height} rx={5} fill={bg} />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={14}
        fontWeight={600}
        fill={color}
      >
        {text}
      </text>
    </g>
  )
}

interface DashboardChartsProps {
  periodLabel: string
  trendData: { date: string; total: number; onTime: number; late: number; range?: string }[]
  trendDescription?: string
  categoryData: { name: string; value: number }[]
  topItemsData: { name: string; value: number }[]
  deptData: { name: string; value: number }[]
  punctualityData: { name: string; value: number }[]
}

export function DashboardCharts({
  periodLabel,
  trendData,
  trendDescription,
  categoryData,
  topItemsData,
  deptData,
  punctualityData,
}: DashboardChartsProps) {
  const [showReturnStatus, setShowReturnStatus] = useState(true)
  const [showTotal, setShowTotal] = useState(true)

  return (
    <div className="flex flex-col gap-6 mt-8">
      {/* ROW 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Trend Peminjaman (Area Chart with Gradient) */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-800">Tren Peminjaman</CardTitle>
                <CardDescription>
                  {trendDescription || 'Intensitas peminjaman dari waktu ke waktu'}
                  <span className="text-gray-400"> · {periodLabel}</span>
                </CardDescription>
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  role="switch"
                  aria-checked={showTotal}
                  onClick={() => setShowTotal((v) => !v)}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    showTotal
                      ? 'border-blue-200 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-gray-50 text-gray-500'
                  }`}
                >
                  <span
                    className={`relative h-4 w-7 rounded-full transition-colors ${
                      showTotal ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${
                        showTotal ? 'left-3.5' : 'left-0.5'
                      }`}
                    />
                  </span>
                  Total pinjam
                </button>
                <button
                  type="button"
                  role="switch"
                  aria-checked={showReturnStatus}
                  onClick={() => setShowReturnStatus((v) => !v)}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    showReturnStatus
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 bg-gray-50 text-gray-500'
                  }`}
                >
                  <span
                    className={`relative h-4 w-7 rounded-full transition-colors ${
                      showReturnStatus ? 'bg-emerald-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${
                        showReturnStatus ? 'left-3.5' : 'left-0.5'
                      }`}
                    />
                  </span>
                  Status kembali
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trendData} margin={{ top: 24, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} tickMargin={10} minTickGap={20} />
                  {showTotal && (
                    <YAxis yAxisId="left" tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
                  )}
                  {showReturnStatus && (
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      allowDecimals={false}
                      width={30}
                    />
                  )}
                  <Tooltip
                    cursor={{ stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '4 4' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    // Show the date range for each point (e.g. "W5 · 27 Jan – 2 Feb")
                    labelFormatter={(label, payload) => {
                      const range = payload?.[0]?.payload?.range
                      return range && range !== label ? `${label} · ${range}` : label
                    }}
                  />
                  {(showTotal || showReturnStatus) && (
                    <Legend iconType="line" wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  )}
                  {showTotal && (
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="total"
                      name="Peminjaman"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorTotal)"
                      activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }}
                    >
                      <LabelList
                        dataKey="total"
                        position="top"
                        offset={10}
                        content={<ValueLabel bg="#dbeafe" color="#1d4ed8" />}
                      />
                    </Area>
                  )}
                  {showReturnStatus && (
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="onTime"
                      name="Tepat Waktu"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 5, strokeWidth: 0, fill: '#10b981' }}
                    >
                      <LabelList
                        dataKey="onTime"
                        position="top"
                        offset={10}
                        content={<ValueLabel bg="#d1fae5" color="#047857" />}
                      />
                    </Line>
                  )}
                  {showReturnStatus && (
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="late"
                      name="Terlambat"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 5, strokeWidth: 0, fill: '#ef4444' }}
                    >
                      <LabelList
                        dataKey="late"
                        position="bottom"
                        offset={10}
                        content={<ValueLabel bg="#fee2e2" color="#b91c1c" />}
                      />
                    </Line>
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 2. Top 3 Barang (Leaderboard) */}
        <Card className="col-span-1 border-amber-200 shadow-sm bg-gradient-to-b from-amber-50/50 to-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
              🏆 Top 3 Barang
            </CardTitle>
            <CardDescription>Barang terlaris {periodLabel}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 mt-2">
              {topItemsData.length > 0 ? (
                topItemsData.map((item, index) => (
                  <div key={index} className="flex items-center p-3 rounded-xl bg-white border border-gray-100 shadow-sm transition-transform hover:-translate-y-1">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full mr-3 font-extrabold text-lg shadow-inner ${
                      index === 0 ? 'bg-gradient-to-br from-yellow-300 to-amber-500 text-white' :
                      index === 1 ? 'bg-gradient-to-br from-gray-300 to-slate-400 text-white' :
                      'bg-gradient-to-br from-orange-300 to-amber-700 text-white'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <h4 className="text-sm font-bold text-gray-900 truncate">{item.name}</h4>
                      <div className="text-xs font-medium text-gray-500 mt-0.5">Dipinjam {item.value}x</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-gray-500 text-sm">
                  Belum ada data
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ROW 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 3. Departemen Teraktif */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Departemen Teraktif</CardTitle>
            <CardDescription>Divisi dengan transaksi terbanyak</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                  <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} hide />
                  <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} fontSize={12} width={90} />
                  <Tooltip
                    cursor={{ fill: '#f3f4f6' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} maxBarSize={30} label={{ position: 'right', fontSize: 12, fill: '#6b7280' }}>
                    {deptData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 4. Kategori Terpopuler */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Kategori Terpopuler</CardTitle>
            <CardDescription>Berdasarkan kuantitas barang</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-center">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="45%"
                    outerRadius={75}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 5. Ketepatan Waktu Pengembalian */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Ketepatan Pengembalian</CardTitle>
            <CardDescription>Tepat waktu vs Terlambat</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-center">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={punctualityData}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {punctualityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PUNCTUALITY_COLORS[index % PUNCTUALITY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
