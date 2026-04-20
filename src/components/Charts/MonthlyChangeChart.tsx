import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { motion } from 'framer-motion'
import { buildMonthlyChangeSeries, formatCurrency } from '../../lib/utils'
import type { BalanceEntry } from '../../types/finance'

interface Props {
  entries: BalanceEntry[]
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  const val = payload[0].value
  return (
    <div className="glass rounded-xl px-3 py-2 text-sm shadow-xl">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className={`font-semibold ${val >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
        {val >= 0 ? '+' : ''}{formatCurrency(val)}
      </p>
    </div>
  )
}

export function MonthlyChangeChart({ entries }: Props) {
  const data = useMemo(() => buildMonthlyChangeSeries(entries, 12), [entries])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="h-48"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) =>
              new Intl.NumberFormat('de-DE', { notation: 'compact', style: 'currency', currency: 'EUR' }).format(v)
            }
            width={65}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="change" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.change >= 0 ? '#10b981' : '#f43f5e'} opacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
