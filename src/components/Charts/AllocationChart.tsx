import { useMemo, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { motion } from 'framer-motion'
import { getLatestBalancePerAccount, formatCurrency, ACCOUNT_TYPES } from '../../lib/utils'
import type { Account, BalanceEntry } from '../../types/finance'

interface Props {
  accounts: Account[]
  entries: BalanceEntry[]
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl px-3 py-2 text-sm shadow-xl border border-white/10">
      <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-1">{payload[0].name}</p>
      <p className="text-white font-bold">{formatCurrency(payload[0].value)}</p>
      <p className="text-accent-400 text-[10px] font-bold">{(payload[0].percent * 100).toFixed(1)}% Anteil</p>
    </div>
  )
}

export function AllocationChart({ accounts, entries }: Props) {
  const [mode, setMode] = useState<'account' | 'type'>('account')

  const data = useMemo(() => {
    const latest = getLatestBalancePerAccount(entries)
    
    if (mode === 'account') {
      return accounts
        .filter((a) => latest[a.id] !== undefined && latest[a.id] > 0)
        .map((a) => ({
          name: a.name,
          value: latest[a.id],
          color: a.color ?? '#6366f1',
        }))
        .sort((a, b) => b.value - a.value)
    } else {
      const typeMap: Record<string, number> = {}
      accounts.forEach(a => {
        const bal = latest[a.id] || 0
        if (bal > 0) {
          typeMap[a.type] = (typeMap[a.type] || 0) + bal
        }
      })
      return Object.entries(typeMap).map(([type, value], i) => ({
        name: ACCOUNT_TYPES.find(t => t.value === type)?.label || type,
        value,
        color: `hsl(${(i * 137.5) % 360}, 70%, 60%)`,
      })).sort((a, b) => b.value - a.value)
    }
  }, [accounts, entries, mode])

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-600 text-xs font-medium uppercase tracking-widest">
        Keine Daten
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex bg-white/5 p-1 rounded-lg w-fit">
        <button
          onClick={() => setMode('account')}
          className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
            mode === 'account' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          KONTEN
        </button>
        <button
          onClick={() => setMode('type')}
          className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
            mode === 'type' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          TYPEN
        </button>
      </div>

      <motion.div
        key={mode}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="h-64"
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={85}
              paddingAngle={4}
              dataKey="value"
              stroke="none"
              animationBegin={0}
              animationDuration={800}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              iconSize={6}
              formatter={(value) => <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  )
}
