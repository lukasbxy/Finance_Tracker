import { useMemo, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'
import { formatCurrency } from '../../lib/utils'
import type { Account, BalanceEntry } from '../../types/finance'

interface Props {
  account: Account
  entries: BalanceEntry[]
}

type Range = '3m' | '6m' | '1y' | '2y' | '3y' | '5y' | 'all'

const RANGE_DAYS: Record<Range, number> = {
  '3m': 90, '6m': 180, '1y': 365, '2y': 730, '3y': 1095, '5y': 1825, 'all': Infinity,
}
const RANGE_LABELS: Record<Range, string> = {
  '3m': '3M', '6m': '6M', '1y': '1J', '2y': '2J', '3y': '3J', '5y': '5J', 'all': 'Alles',
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

function getDateLabel(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  if (days <= 90) return d.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })
  if (days <= 365) return d.toLocaleDateString('de-DE', { month: 'short' })
  return d.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' })
}

export function AccountHistoryChart({ account, entries }: Props) {
  const color = account.color ?? '#6366f1'
  const [range, setRange] = useState<Range>('all')

  const cutoffMs = RANGE_DAYS[range] === Infinity
    ? 0
    : Date.now() - RANGE_DAYS[range] * 86400_000

  const data = useMemo(() => {
    const filtered = entries.filter(
      (e) => RANGE_DAYS[range] === Infinity || new Date(e.recorded_at).getTime() >= cutoffMs,
    )
    return [...filtered]
      .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
      .map((e) => ({
        dateLabel: getDateLabel(e.recorded_at, RANGE_DAYS[range]),
        amount: Number(e.amount),
      }))
  }, [entries, range, cutoffMs])

  const gradId = `acHist_${account.id.replace(/-/g, '')}`

  return (
    <div>
      <div className="flex gap-1 mb-3 flex-wrap">
        {(Object.keys(RANGE_DAYS) as Range[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-2 py-0.5 rounded-md text-xs font-medium transition-colors ${
              range === r
                ? 'bg-white/15 text-white'
                : 'text-gray-600 hover:text-gray-300 hover:bg-white/10'
            }`}
          >
            {RANGE_LABELS[r]}
          </button>
        ))}
      </div>
      {data.length < 2 ? (
        <div className="h-48 flex items-center justify-center text-gray-600 text-sm">
          Nicht genug Einträge für diesen Zeitraum
        </div>
      ) : (
        <motion.div
          key={range}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
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
      )}
    </div>
  )
}
