import { formatCurrency } from '../../lib/utils'
import { Card } from '../UI/Card'
import { Coffee, Home, Plane, Heart } from 'lucide-react'

interface Props {
  totalWealth: number
}

export function FinancialFreedom({ totalWealth }: Props) {
  const passiveMonthly = (totalWealth * 0.04) / 12
  
  const milestones = [
    { label: 'Kaffee & Snacks', goal: 100, icon: Coffee, color: 'text-amber-400' },
    { label: 'Nebenkosten', goal: 500, icon: Heart, color: 'text-rose-400' },
    { label: 'Miete & Wohnen', goal: 1200, icon: Home, color: 'text-blue-400' },
    { label: 'Finanzielle Freiheit', goal: 2500, icon: Plane, color: 'text-emerald-400' },
  ]

  return (
    <Card className="p-6 border-white/5 bg-white/[0.01]">
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
        <Heart size={16} className="text-rose-400" />
        Finanzielle Freiheit
      </h3>
      
      <div className="text-center mb-8">
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Monatliches Passiv-Einkommen*</p>
        <p className="text-3xl font-black text-white tracking-tighter">{formatCurrency(passiveMonthly)}</p>
        <p className="text-[10px] text-gray-600 font-medium mt-1 italic">*Basierend auf der 4% Entnahmeregel</p>
      </div>

      <div className="space-y-5">
        {milestones.map((m) => {
          const progress = Math.min(100, (passiveMonthly / m.goal) * 100)
          return (
            <div key={m.label} className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <m.icon size={12} className={m.color} />
                  <span className="text-gray-300">{m.label}</span>
                </div>
                <span className={progress === 100 ? 'text-emerald-400' : 'text-gray-500'}>
                  {progress === 100 ? 'ERREICHT' : `${progress.toFixed(0)}%`}
                </span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${progress === 100 ? 'bg-emerald-500' : 'bg-accent-500/40'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-gray-600 font-bold uppercase">
                <span>Ziel: {formatCurrency(m.goal)} / Monat</span>
                <span>Benötigt: {formatCurrency(m.goal * 12 * 25)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
