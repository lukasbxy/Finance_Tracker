import { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { motion } from 'framer-motion'
import { getLatestBalancePerAccount, formatCurrency } from '../../lib/utils'
import type { Account, BalanceEntry } from '../../types/finance'

interface Props {
  accounts: Account[]
  entries: BalanceEntry[]
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-xl px-3 py-2 text-sm shadow-xl">
      <p className="text-gray-300 font-medium">{payload[0].name}</p>
      <p className="text-white font-semibold">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

export function AllocationChart({ accounts, entries }: Props) {
  const data = useMemo(() => {
    const latest = getLatestBalancePerAccount(entries)
    return accounts
      .filter((a) => latest[a.id] !== undefined && latest[a.id] > 0)
      .map((a) => ({
        name: a.name,
        value: latest[a.id],
        color: a.color ?? '#6366f1',
      }))
      .sort((a, b) => b.value - a.value)
  }, [accounts, entries])

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-600 text-sm">
        Keine Daten vorhanden
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="h-64"
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} opacity={0.9} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => <span className="text-gray-400 text-xs">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
