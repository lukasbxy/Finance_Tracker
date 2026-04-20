import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Plus, ChevronRight } from 'lucide-react'
import { useAccounts } from '../hooks/useAccounts'
import { useBalanceEntries } from '../hooks/useBalanceEntries'
import { Card } from '../components/UI/Card'
import { Button } from '../components/UI/Button'
import { NetWorthChart } from '../components/Charts/NetWorthChart'
import { AllocationChart } from '../components/Charts/AllocationChart'
import { MonthlyChangeChart } from '../components/Charts/MonthlyChangeChart'
import { AddBalanceModal } from '../components/Accounts/AddBalanceModal'
import { AccountForm } from '../components/Accounts/AccountForm'
import {
  formatCurrency,
  getLatestBalancePerAccount,
  getAccountTypeIcon,
} from '../lib/utils'
import type { Account } from '../types/finance'

type TimeRange = '30d' | '90d' | '1y' | 'all'

const TIME_RANGE_DAYS: Record<TimeRange, number> = {
  '30d': 30, '90d': 90, '1y': 365, 'all': 3650,
}

export function Dashboard() {
  const { accounts, createAccount, loading: accountsLoading } = useAccounts()
  const { entries, addEntry, loading: entriesLoading } = useBalanceEntries()
  const navigate = useNavigate()

  const [timeRange, setTimeRange] = useState<TimeRange>('1y')
  const [addBalanceFor, setAddBalanceFor] = useState<Account | null>(null)
  const [showCreateAccount, setShowCreateAccount] = useState(false)

  const latestBalances = useMemo(() => getLatestBalancePerAccount(entries), [entries])

  const activeAccounts = accounts.filter((a) => !a.is_closed)

  const totalWealth = useMemo(
    () => activeAccounts.reduce((sum, a) => sum + (latestBalances[a.id] ?? 0), 0),
    [activeAccounts, latestBalances],
  )

  const wealthLastWeek = useMemo(() => {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 7)
    const old = getLatestBalancePerAccount(entries, cutoff)
    return activeAccounts.reduce((sum, a) => sum + (old[a.id] ?? 0), 0)
  }, [activeAccounts, entries])

  const wealthDelta = totalWealth - wealthLastWeek
  const wealthDeltaPct = wealthLastWeek !== 0 ? (wealthDelta / Math.abs(wealthLastWeek)) * 100 : 0

  const loading = accountsLoading || entriesLoading

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:px-6">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Deine Finanzübersicht</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowCreateAccount(true)}>
            <Plus size={16} />
            Konto
          </Button>
        </div>
      </motion.div>

      {/* Net Worth Hero */}
      <Card className="mb-6 bg-gradient-to-br from-accent-500/15 to-violet-500/10 border-accent-500/20">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-gray-400 text-sm mb-1">Gesamtvermögen</p>
            <motion.p
              className="text-4xl font-bold text-white tracking-tight"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            >
              {formatCurrency(totalWealth)}
            </motion.p>
            <div className={`flex items-center gap-1.5 mt-2 text-sm ${wealthDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {wealthDelta >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span className="font-medium">
                {wealthDelta >= 0 ? '+' : ''}{formatCurrency(wealthDelta)}
              </span>
              <span className="text-gray-500">
                ({wealthDeltaPct >= 0 ? '+' : ''}{wealthDeltaPct.toFixed(1)}%) letzte 7 Tage
              </span>
            </div>
          </div>
          <div className="flex gap-1">
            {(['30d', '90d', '1y', 'all'] as TimeRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  timeRange === r
                    ? 'bg-accent-500/30 text-accent-300 border border-accent-500/30'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/8'
                }`}
              >
                {r === 'all' ? 'Alles' : r}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-5">
          <NetWorthChart entries={entries} days={TIME_RANGE_DAYS[timeRange]} />
        </div>
      </Card>

      {/* Account Cards */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Aktive Konten</h2>
        {activeAccounts.length === 0 ? (
          <Card className="text-center py-10">
            <p className="text-gray-500 mb-4">Noch keine Konten angelegt.</p>
            <Button onClick={() => setShowCreateAccount(true)}>
              <Plus size={16} />
              Erstes Konto anlegen
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeAccounts.map((account, i) => {
              const balance = latestBalances[account.id] ?? null
              return (
                <motion.div
                  key={account.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <div
                    className="glass rounded-2xl p-4 cursor-pointer hover:bg-white/8 transition-colors group"
                    onClick={() => navigate(`/accounts/${account.id}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                          style={{ backgroundColor: `${account.color ?? '#6366f1'}25` }}
                        >
                          {account.icon ?? getAccountTypeIcon(account.type)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{account.name}</p>
                          <p className="text-xs text-gray-500">{account.type}</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-gray-600 group-hover:text-gray-400 transition-colors mt-1" />
                    </div>
                    <p className={`text-xl font-bold ${balance === null ? 'text-gray-600' : 'text-white'}`}>
                      {balance !== null ? formatCurrency(balance) : '—'}
                    </p>
                    <button
                      onClick={(e) => { e.stopPropagation(); setAddBalanceFor(account) }}
                      className="mt-3 w-full text-xs text-gray-500 hover:text-accent-400 transition-colors py-1.5 rounded-lg hover:bg-accent-500/10 flex items-center justify-center gap-1.5"
                    >
                      <Plus size={13} />
                      Stand aktualisieren
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Charts Row */}
      {entries.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <Card animate={false} className="rounded-2xl">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Aufteilung heute</h3>
            <AllocationChart accounts={accounts} entries={entries} />
          </Card>
          <Card animate={false} className="rounded-2xl">
            <h3 className="text-sm font-semibold text-gray-300 mb-4">Monatliche Veränderung</h3>
            <MonthlyChangeChart entries={entries} />
          </Card>
        </div>
      )}

      {/* Modals */}
      {addBalanceFor && (
        <AddBalanceModal
          open={!!addBalanceFor}
          onClose={() => setAddBalanceFor(null)}
          account={addBalanceFor}
          onAdd={addEntry}
        />
      )}
      <AccountForm
        open={showCreateAccount}
        onClose={() => setShowCreateAccount(false)}
        onSave={createAccount}
      />
    </div>
  )
}
