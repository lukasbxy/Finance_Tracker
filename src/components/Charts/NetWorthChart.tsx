import { useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { motion } from 'framer-motion'
import { buildNetWorthTimeSeries } from '../../lib/utils'
import type { BalanceEntry } from '../../types/finance'

interface Props {
  entries: BalanceEntry[]
  days?: number
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl px-3 py-2 text-sm shadow-xl">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className="text-white font-semibold">
        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(payload[0].value)}
      </p>
    </div>
  )
}

function getDateLabel(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  if (days <= 90) return d.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })
  if (days <= 365) return d.toLocaleDateString('de-DE', { month: 'short' })
  return d.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' })
}

export function NetWorthChart({ entries, days = 365 }: Props) {
  const data = useMemo(() => buildNetWorthTimeSeries(entries, days), [entries, days])

  const formatted = useMemo(() => data.map((d) => ({
    ...d,
    dateLabel: getDateLabel(d.date, days),
  })), [data, days])

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
      className="h-64"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formatted} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <defs>
            <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="dateLabel"
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            ticks={visibleTicks}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) =>
              new Intl.NumberFormat('de-DE', { notation: 'compact', style: 'currency', currency: 'EUR' }).format(v)
            }
            width={70}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#netWorthGrad)"
            dot={false}
            activeDot={{ r: 4, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
