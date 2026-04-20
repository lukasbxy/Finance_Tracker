import { useMemo } from 'react'
import { getLatestBalancePerAccount } from '../../lib/utils'
import type { Account, BalanceEntry } from '../../types/finance'
import { Card } from '../UI/Card'
import { CheckCircle2, AlertCircle, Info, Activity } from 'lucide-react'

interface Props {
  accounts: Account[]
  entries: BalanceEntry[]
}

export function PortfolioHealth({ accounts, entries }: Props) {
  const healthItems = useMemo(() => {
    const latest = getLatestBalancePerAccount(entries)
    const total = Object.values(latest).reduce((s, v) => s + v, 0)
    if (total === 0) return []

    const liquid = accounts.filter(a => ['bank', 'cash', 'wallet', 'paypal'].includes(a.type))
      .reduce((s, a) => s + (latest[a.id] ?? 0), 0)
    const liquidPct = (liquid / total) * 100

    const invested = accounts.filter(a => ['depot', 'crypto'].includes(a.type))
      .reduce((s, a) => s + (latest[a.id] ?? 0), 0)
    const investedPct = (invested / total) * 100

    const items = []

    // Liquidity Check
    items.push({
      label: 'Liquidität',
      value: `${liquidPct.toFixed(0)}%`,
      status: liquidPct > 10 && liquidPct < 40 ? 'good' : 'warning',
      desc: liquidPct < 10 ? 'Niedriger Puffer' : liquidPct > 40 ? 'Hohe Cashquote' : 'Gesunde Reserve',
      tip: 'Ideal: 10-30% für Notfälle'
    })

    // Investment Check
    items.push({
      label: 'Investitionsquote',
      value: `${investedPct.toFixed(0)}%`,
      status: investedPct > 50 ? 'good' : 'warning',
      desc: investedPct > 50 ? 'Guter Vermögensaufbau' : 'Geringe Renditechancen',
      tip: 'Ziel: >50% für langfristiges Wachstum'
    })

    // Diversification
    const activeCount = accounts.filter(a => !a.is_closed).length
    items.push({
      label: 'Diversifikation',
      value: `${activeCount} Konten`,
      status: activeCount >= 3 ? 'good' : 'warning',
      desc: activeCount >= 3 ? 'Gute Streuung' : 'Klumpenrisiko möglich',
      tip: 'Mehrere Konten reduzieren Abhängigkeit'
    })

    return items
  }, [accounts, entries])

  if (healthItems.length === 0) return null

  return (
    <Card className="p-6 border-white/5 bg-white/[0.01]">
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
        <Activity size={16} className="text-accent-400" />
        Portfolio-Check
      </h3>
      <div className="grid grid-cols-1 gap-4">
        {healthItems.map((item) => (
          <div key={item.label} className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{item.label}</span>
              {item.status === 'good' ? (
                <CheckCircle2 size={14} className="text-emerald-400" />
              ) : (
                <AlertCircle size={14} className="text-amber-400" />
              )}
            </div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-lg font-bold text-white leading-none mb-1">{item.value}</p>
                <p className={`text-[10px] font-bold uppercase tracking-tight ${item.status === 'good' ? 'text-emerald-500/80' : 'text-amber-500/80'}`}>
                  {item.desc}
                </p>
              </div>
              <div className="flex items-center gap-1 text-[9px] text-gray-600 bg-white/5 px-2 py-1 rounded-md">
                <Info size={10} />
                <span>{item.tip}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
