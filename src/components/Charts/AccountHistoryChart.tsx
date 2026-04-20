import { useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
import { formatCurrency } from '../../lib/utils'
import type { Account, BalanceEntry } from '../../types/finance'

interface Props {
  account: Account
  entries: BalanceEntry[]
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl px-3 py-2 text-sm shadow-xl">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className="text-white font-semibold">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

export function AccountHistoryChart({ account, entries }: Props) {
  const color = account.color ?? '#6366f1'

  const data = useMemo(() =>
    [...entries]
      .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
      .map((e) => ({
        dateLabel: new Date(e.recorded_at).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: '2-digit' }),
        amount: Number(e.amount),
      })),
    [entries],
  )

  if (data.length < 2) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-600 text-sm">
        Mindestens 2 Einträge für Chart benötigt
      </div>
    )
  }

  const gradId = `acHist_${account.id.replace(/-/g, '')}`

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="h-48"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="dateLabel" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => new Intl.NumberFormat('de-DE', { notation: 'compact', style: 'currency', currency: 'EUR' }).format(v)}
            width={65}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="amount"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradId})`}
            dot={{ r: 3, fill: color, stroke: '#0f172a', strokeWidth: 2 }}
            activeDot={{ r: 5, fill: color, stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
