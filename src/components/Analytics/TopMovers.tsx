import { useMemo } from 'react'
import { getLatestBalancePerAccount, formatCurrency } from '../../lib/utils'
import type { Account, BalanceEntry } from '../../types/finance'
import { Card } from '../UI/Card'
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import { TypeIcon } from '../UI/TypeIcon'

interface Props {
  accounts: Account[]
  entries: BalanceEntry[]
}

export function TopMovers({ accounts, entries }: Props) {
  const movers = useMemo(() => {
    const today = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(today.getDate() - 30)

    const latest = getLatestBalancePerAccount(entries)
    const old = getLatestBalancePerAccount(entries, thirtyDaysAgo)

    return accounts
      .map(a => {
        const current = latest[a.id] ?? 0
        const previous = old[a.id] ?? 0
        const diff = current - previous
        const pct = previous !== 0 ? (diff / Math.abs(previous)) * 100 : 0
        return { ...a, current, previous, diff, pct }
      })
      .filter(a => a.diff !== 0)
      .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
      .slice(0, 5)
  }, [accounts, entries])

  if (movers.length === 0) return null

  return (
    <Card className="p-6 border-white/5 bg-white/[0.01]">
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
        <ArrowRight size={16} className="text-blue-400" />
        Top Movers (30 Tage)
      </h3>
      <div className="space-y-4">
        {movers.map((m) => (
          <div key={m.id} className="flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: m.color || '#6366f1' }}
              >
                <TypeIcon type={m.type} size={14} />
              </div>
              <div>
                <p className="text-xs font-bold text-white leading-none mb-1">{m.name}</p>
                <p className="text-[10px] text-gray-500 uppercase font-bold">{m.type}</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`flex items-center justify-end gap-1 text-xs font-bold ${m.diff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {m.diff > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {formatCurrency(Math.abs(m.diff))}
              </div>
              <p className="text-[10px] text-gray-600 font-bold">
                {m.diff > 0 ? '+' : '-'}{Math.abs(m.pct).toFixed(1)}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
