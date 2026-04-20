import { useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { motion } from 'framer-motion'
import { buildNetWorthTimeSeries } from '../../lib/utils'
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
  const total = sortedPayload.find(p => p.dataKey === 'total')?.value || 0

  return (
    <div className="glass rounded-2xl px-4 py-3 text-sm shadow-2xl border border-white/10 min-w-[200px]">
      <p className="text-gray-400 text-xs mb-2 font-medium uppercase tracking-wider">{label}</p>
      <div className="space-y-1.5 mb-2 max-h-48 overflow-y-auto pr-1">
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
                  {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(entry.value)}
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
          {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(total)}
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
  const data = useMemo(() => buildNetWorthTimeSeries(entries, days), [entries, days])

  const formatted = useMemo(() => data.map((d) => ({
    ...d,
    dateLabel: getDateLabel(d.date, days),
  })), [data, days])

  const activeAccounts = useMemo(() => 
    accounts.filter(a => formatted.some((d: any) => d[a.id] > 0)),
    [accounts, formatted]
  )

  const tickInterval = Math.max(1, Math.floor(formatted.length / 7))
  const visibleTicks = formatted
    .filter((_, i) => i % tickInterval === 0 || i === formatted.length - 1)
    .map((d) => d.dateLabel)

  return (
    <motion.div
      key={days}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="h-[350px] w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formatted} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
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
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="top" 
            height={36} 
            iconType="circle" 
            iconSize={8}
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
  )
}
