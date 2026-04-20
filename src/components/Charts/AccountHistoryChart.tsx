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
  '3m': '3M', '6m': '6M', '1y': '1J', '2y': '2J', '3y': '3J', '5y': '5J', 'all': 'ALLES',
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl px-3 py-2 text-sm shadow-xl border border-white/10">
      <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-1">{label}</p>
      <p className="text-white font-bold">{formatCurrency(payload[0].value)}</p>
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

  const data = useMemo(() => {
    const cutoffMs = RANGE_DAYS[range] === Infinity
      ? 0
      : Date.now() - RANGE_DAYS[range] * 86400_000
    const filtered = entries.filter(
      (e) => RANGE_DAYS[range] === Infinity || new Date(e.recorded_at).getTime() >= cutoffMs,
    )
    return [...filtered]
      .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
      .map((e) => ({
        dateLabel: getDateLabel(e.recorded_at, RANGE_DAYS[range]),
        amount: Number(e.amount),
      }))
  }, [entries, range])

  const gradId = `acHist_${account.id.replace(/-/g, '')}`

  return (
    <div className="space-y-6">
      <div className="flex bg-white/5 p-1 rounded-lg w-fit">
        {(Object.keys(RANGE_DAYS) as Range[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
              range === r
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {RANGE_LABELS[r]}
          </button>
        ))}
      </div>
      
      {data.length < 2 ? (
        <div className="h-64 flex items-center justify-center text-gray-600 text-xs font-bold uppercase tracking-widest">
          Zu wenig Daten
        </div>
      ) : (
        <motion.div
          key={range}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="h-64"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis 
                dataKey="dateLabel" 
                tick={{ fill: '#6b7280', fontSize: 10 }} 
                axisLine={false} 
                tickLine={false} 
                dy={10}
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => new Intl.NumberFormat('de-DE', { notation: 'compact', style: 'currency', currency: 'EUR' }).format(v)}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="amount"
                stroke={color}
                strokeWidth={3}
                fill={`url(#${gradId})`}
                dot={{ r: 4, fill: color, stroke: '#0f172a', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: color, stroke: '#fff', strokeWidth: 2 }}
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </div>
  )
}
