import { useMemo } from 'react'
import { getLatestBalancePerAccount, formatCurrency } from '../../lib/utils'
import type { Account, BalanceEntry } from '../../types/finance'
import { Card } from '../UI/Card'
import { Shield, TrendingUp, Zap, HelpCircle } from 'lucide-react'

interface Props {
  accounts: Account[]
  entries: BalanceEntry[]
}

const CATEGORIES = [
  { id: 'safe', label: 'Sicherheit', types: ['bank', 'savings', 'cash'], icon: Shield, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { id: 'invested', label: 'Investiert', types: ['depot'], icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { id: 'speculative', label: 'Spekulativ', types: ['crypto'], icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { id: 'other', label: 'Sonstiges', types: ['wallet', 'paypal', 'other'], icon: HelpCircle, color: 'text-gray-400', bg: 'bg-gray-500/10' },
]

export function AssetClassAnalysis({ accounts, entries }: Props) {
  const data = useMemo(() => {
    const latest = getLatestBalancePerAccount(entries)
    const totalWealth = Object.values(latest).reduce((s, v) => s + v, 0)

    return CATEGORIES.map(cat => {
      const catAccounts = accounts.filter(a => cat.types.includes(a.type))
      const amount = catAccounts.reduce((sum, a) => sum + (latest[a.id] ?? 0), 0)
      const pct = totalWealth > 0 ? (amount / totalWealth) * 100 : 0
      
      return { ...cat, amount, pct }
    }).filter(c => c.amount > 0)
  }, [accounts, entries])

  return (
    <Card className="p-6 border-white/5 bg-white/[0.01]">
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
        <Shield size={16} className="text-emerald-400" />
        Asset-Klassen & Risiko
      </h3>
      <div className="space-y-4">
        {data.map((cat) => (
          <div key={cat.id} className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${cat.bg} ${cat.color}`}>
                  <cat.icon size={14} />
                </div>
                <span className="text-white uppercase tracking-wider">{cat.label}</span>
              </div>
              <span className="text-gray-400">{cat.pct.toFixed(1)}%</span>
            </div>
            <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
              <div 
                className={`absolute top-0 left-0 h-full transition-all duration-1000 ${cat.bg.replace('/10', '/40')}`}
                style={{ width: `${cat.pct}%` }}
              />
            </div>
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] text-gray-600 font-bold uppercase">Allokation</span>
              <span className="text-[10px] text-gray-400 font-bold">{formatCurrency(cat.amount)}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
