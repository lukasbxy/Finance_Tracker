import { useMemo } from 'react'
import { getLatestBalancePerAccount, formatCurrency } from '../../lib/utils'
import type { BalanceEntry } from '../../types/finance'
import { Card } from '../UI/Card'
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'

interface Props {
  entries: BalanceEntry[]
}

export function YearlyPerformance({ entries }: Props) {
  const yearlyData = useMemo(() => {
    if (entries.length === 0) return []

    const years = Array.from(new Set(entries.map(e => new Date(e.recorded_at).getFullYear()))).sort((a, b) => b - a)
    const result = []

    for (const year of years) {
      const yearEnd = new Date(year, 11, 31, 23, 59, 59)
      const prevYearEnd = new Date(year - 1, 11, 31, 23, 59, 59)

      const balances = getLatestBalancePerAccount(entries, yearEnd)
      const prevBalances = getLatestBalancePerAccount(entries, prevYearEnd)

      const total = Object.values(balances).reduce((s, v) => s + v, 0)
      const prevTotal = Object.values(prevBalances).reduce((s, v) => s + v, 0)

      const diff = total - prevTotal
      const pct = prevTotal !== 0 ? (diff / Math.abs(prevTotal)) * 100 : 0

      if (total > 0 || prevTotal > 0) {
        result.push({ year, total, diff, pct })
      }
    }
    return result
  }, [entries])

  if (yearlyData.length === 0) return null

  return (
    <Card className="p-0 overflow-hidden border-white/5 bg-white/[0.01]">
      <div className="p-5 border-b border-white/5">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <ArrowUpRight size={16} className="text-accent-400" />
          Jahres-Performance
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-white/5">
              <th className="px-5 py-3 font-bold">Jahr</th>
              <th className="px-5 py-3 font-bold text-right">Stand Ende Jahr</th>
              <th className="px-5 py-3 font-bold text-right">Veränderung</th>
              <th className="px-5 py-3 font-bold text-right">%</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {yearlyData.map((d) => (
              <tr key={d.year} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-4 font-bold text-white">{d.year}</td>
                <td className="px-5 py-4 text-right font-medium text-gray-300">{formatCurrency(d.total)}</td>
                <td className={`px-5 py-4 text-right font-bold ${d.diff > 0 ? 'text-emerald-400' : d.diff < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                  {d.diff > 0 ? '+' : ''}{formatCurrency(d.diff)}
                </td>
                <td className="px-5 py-4 text-right">
                  <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    d.pct > 0 ? 'bg-emerald-500/10 text-emerald-400' : 
                    d.pct < 0 ? 'bg-red-500/10 text-red-400' : 
                    'bg-gray-500/10 text-gray-400'
                  }`}>
                    {d.pct > 0 ? <ArrowUpRight size={10} /> : d.pct < 0 ? <ArrowDownRight size={10} /> : <Minus size={10} />}
                    {Math.abs(d.pct).toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
