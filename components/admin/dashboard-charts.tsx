'use client'

import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#64748b']
const PUNCTUALITY_COLORS = ['#10b981', '#ef4444'] // Green for On-Time, Red for Late

interface DashboardChartsProps {
  periodLabel: string
  trendData: { date: string; total: number }[]
  categoryData: { name: string; value: number }[]
  topItemsData: { name: string; value: number }[]
  deptData: { name: string; value: number }[]
  punctualityData: { name: string; value: number }[]
}

export function DashboardCharts({
  periodLabel,
  trendData,
  categoryData,
  topItemsData,
  deptData,
  punctualityData,
}: DashboardChartsProps) {

  return (
    <div className="flex flex-col gap-6 mt-8">
      {/* ROW 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Trend Peminjaman (Area Chart with Gradient) */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-gray-800">Tren Peminjaman</CardTitle>
            <CardDescription>Intensitas peminjaman dari waktu ke waktu</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} tickMargin={10} minTickGap={20} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
                  <Tooltip
                    cursor={{ stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '4 4' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorTotal)"
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }}
                  />
                </AreaChart>
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
