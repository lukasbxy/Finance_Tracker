import { useMemo, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import { buildNetWorthTimeSeries, formatCurrency } from '../../lib/utils'
import type { BalanceEntry, Account } from '../../types/finance'

interface Props {
  accounts: Account[]
  entries: BalanceEntry[]
  days?: number
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  
  // Sort payload by value descending for better readability
  const sortedPayload = [...payload].sort((a, b) => (b.value || 0) - (a.value || 0))
  const total = payload.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0)

  return (
    <div className="glass rounded-2xl px-4 py-3 text-sm shadow-2xl border border-white/10 min-w-[220px] pointer-events-auto hidden md:block">
      <p className="text-gray-400 text-xs mb-2 font-bold uppercase tracking-wider">{label}</p>
      <div className="space-y-1.5 mb-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {sortedPayload.map((entry: any) => {
          if (entry.dataKey === 'total') return null
          const percent = total > 0 ? ((entry.value / total) * 100).toFixed(1) : 0
          return (
            <div key={entry.dataKey} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-gray-300 text-xs truncate max-w-[120px]">{entry.name}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-white font-medium text-xs">
                  {formatCurrency(entry.value)}
                </span>
                <span className="text-[10px] text-gray-500">{percent}%</span>
              </div>
            </div>
          )
        })}
      </div>
      <div className="pt-2 border-t border-white/5 flex items-center justify-between">
        <span className="text-gray-400 font-semibold text-xs">Gesamt</span>
        <span className="text-accent-400 font-bold">
          {formatCurrency(total)}
        </span>
      </div>
    </div>
  )
}

function getDateLabel(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  if (days <= 90) return d.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })
  if (days <= 365) return d.toLocaleDateString('de-DE', { month: 'short' })
  return d.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' })
}

export function NetWorthChart({ accounts, entries, days = 365 }: Props) {
  const [activePoint, setActivePoint] = useState<any>(null)
  const data = useMemo(() => {
    const ids = accounts.map(a => a.id)
    return buildNetWorthTimeSeries(entries, days, ids)
  }, [entries, days, accounts])

  const formatted = useMemo(() => data.map((d) => ({
    ...d,
    dateLabel: getDateLabel(d.date, days),
  })), [data, days])

  const activeAccounts = useMemo(() => 
    accounts.filter(a => formatted.some((d: any) => d[a.id] > 0)),
    [accounts, formatted]
  )

  const sortedActivePayload = useMemo(() => {
    if (!activePoint?.payload) return []
    return [...activePoint.payload]
      .filter(p => p.dataKey !== 'total')
      .sort((a, b) => (b.value || 0) - (a.value || 0))
  }, [activePoint])

  const totalAtPoint = useMemo(() => {
    if (!activePoint?.payload) return 0
    return activePoint.payload.find((p: any) => p.dataKey === 'total')?.value || 
           activePoint.payload.reduce((s: number, p: any) => s + (p.dataKey !== 'total' ? p.value : 0), 0)
  }, [activePoint])

  const tickInterval = Math.max(1, Math.floor(formatted.length / 7))
  const visibleTicks = formatted
    .filter((_, i) => i % tickInterval === 0 || i === formatted.length - 1)
    .map((d) => d.dateLabel)

  return (
    <div className="space-y-6">
      <motion.div
        key={days}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="h-[350px] md:h-[420px] w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart 
            data={formatted} 
            margin={{ top: 20, right: 10, bottom: 0, left: 0 }}
            onMouseMove={(e) => {
              if (e.activePayload) {
                setActivePoint({ label: e.activeLabel, payload: e.activePayload })
              }
            }}
            onMouseLeave={() => setActivePoint(null)}
          >
            <defs>
              {activeAccounts.map(account => (
                <linearGradient key={`grad-${account.id}`} id={`grad-${account.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={account.color || '#6366f1'} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={account.color || '#6366f1'} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis
              dataKey="dateLabel"
              tick={{ fill: '#6b7280', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              ticks={visibleTicks}
              dy={10}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) =>
                new Intl.NumberFormat('de-DE', { notation: 'compact', style: 'currency', currency: 'EUR' }).format(v)
              }
              width={50}
            />
            <Tooltip 
              content={<CustomTooltip />} 
              position={{ y: 0 }}
              wrapperStyle={{ pointerEvents: 'auto', outline: 'none' }}
            />
          <Legend 
            verticalAlign="bottom" 
            align="center"
            iconType="circle" 
            iconSize={8}
            wrapperStyle={{ paddingTop: '20px' }}
            formatter={(value) => <span className="text-[10px] text-gray-500 font-medium">{value}</span>}
          />
            
            {activeAccounts.map((account) => (
              <Area
                key={account.id}
                type="monotone"
                dataKey={account.id}
                name={account.name}
                stackId="1"
                stroke={account.color || '#6366f1'}
                strokeWidth={2}
                fill={`url(#grad-${account.id})`}
                connectNulls
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Mobile Details Panel */}
      <AnimatePresence>
        {activePoint && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="md:hidden glass rounded-2xl p-4 space-y-4 border-white/5"
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{activePoint.label}</p>
              <p className="text-sm font-bold text-accent-400">{formatCurrency(totalAtPoint)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
              {sortedActivePayload.map((entry: any) => (
                <div key={entry.dataKey} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                    <span className="text-[10px] text-gray-300 truncate font-medium">{entry.name}</span>
                  </div>
                  <span className="text-[10px] font-bold text-white shrink-0">
                    {formatCurrency(entry.value)}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
