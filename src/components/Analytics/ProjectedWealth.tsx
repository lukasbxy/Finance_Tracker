import { formatCurrency } from '../../lib/utils'
import { Card } from '../UI/Card'
import { Landmark, FastForward, Timer } from 'lucide-react'

interface Props {
  totalWealth: number
  avgMonthlyChange: number
}

export function ProjectedWealth({ totalWealth, avgMonthlyChange }: Props) {
  const projections = [
    { label: 'In 1 Jahr', months: 12, icon: Timer },
    { label: 'In 5 Jahren', months: 60, icon: FastForward },
    { label: 'In 10 Jahren', months: 120, icon: Landmark },
  ]

  return (
    <Card className="p-6 border-white/5 bg-white/[0.01]">
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
        <FastForward size={16} className="text-violet-400" />
        Hochrechnung
      </h3>
      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-6">
        Basierend auf Ø {formatCurrency(avgMonthlyChange)}/Monat
      </p>
      
      <div className="space-y-6">
        {projections.map((p) => {
          const projectedTotal = totalWealth + avgMonthlyChange * p.months
          return (
            <div key={p.label} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-500/10 text-violet-400 rounded-lg">
                  <p.icon size={16} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none mb-1">{p.label}</p>
                  <p className="text-lg font-bold text-white leading-none">{formatCurrency(projectedTotal)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-600 font-bold uppercase leading-none mb-1">Zuwachs</p>
                <p className="text-xs font-bold text-emerald-400">+{formatCurrency(avgMonthlyChange * p.months)}</p>
              </div>
            </div>
          )
        })}
      </div>
      
      <div className="mt-8 p-3 rounded-xl bg-accent-500/5 border border-accent-500/10">
        <p className="text-[10px] text-accent-300 font-medium leading-relaxed italic text-center">
          Hinweis: Dies ist eine rein mathematische Hochrechnung ohne Berücksichtigung von Zinseszinseffekten oder Marktschwankungen.
        </p>
      </div>
    </Card>
  )
}
