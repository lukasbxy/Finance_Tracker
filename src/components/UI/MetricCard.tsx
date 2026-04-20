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
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
          {subtitle && <p className="text-gray-500 text-xs">{subtitle}</p>}
          
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${trend.value >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              <span className="font-bold">
                {trend.value >= 0 ? '+' : ''}{trend.value.toFixed(1)}%
              </span>
              <span className="text-gray-600">{trend.label}</span>
            </div>
          )}
        </div>
        <div className="p-2 bg-white/5 rounded-xl text-gray-400 group-hover:text-accent-400 group-hover:bg-accent-500/10 transition-all">
          <Icon size={20} />
        </div>
      </div>
    </Card>
  )
}
