import { LucideIcon } from 'lucide-react'
import { Card } from './Card'

interface Props {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: {
    value: number
    label: string
  }
}

export function MetricCard({ title, value, subtitle, icon: Icon, trend }: Props) {
  return (
    <Card className="relative overflow-hidden group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
          <h3 className="text-lg md:text-2xl font-bold text-white mb-0.5 tracking-tight">{value}</h3>
          {subtitle && <p className="text-gray-500 text-[10px] hidden md:block">{subtitle}</p>}
          
          {trend && (
            <div className={`flex items-center gap-1 mt-1.5 text-[10px] md:text-xs ${trend.value >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              <span className="font-bold">
                {trend.value >= 0 ? '+' : ''}{trend.value.toFixed(1)}%
              </span>
              <span className="text-gray-600 hidden sm:inline">{trend.label}</span>
            </div>
          )}
        </div>
        <div className="p-1.5 md:p-2 bg-white/5 rounded-lg md:rounded-xl text-gray-400 group-hover:text-accent-400 group-hover:bg-accent-500/10 transition-all shrink-0">
          <Icon size={16} className="md:w-5 md:h-5" />
        </div>
      </div>
    </Card>
  )
}
