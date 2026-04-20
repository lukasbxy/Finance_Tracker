import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  ChevronRight, 
  BarChart3, 
  PieChart as PieIcon, 
  Calendar,
  ArrowUpRight,
  Target
} from 'lucide-react'
import { useAccounts } from '../hooks/useAccounts'
import { useBalanceEntries } from '../hooks/useBalanceEntries'
import { Card } from '../components/UI/Card'
import { Button } from '../components/UI/Button'
import { NetWorthChart } from '../components/Charts/NetWorthChart'
import { AllocationChart } from '../components/Charts/AllocationChart'
import { MonthlyChangeChart } from '../components/Charts/MonthlyChangeChart'
import { MetricCard } from '../components/UI/MetricCard'
import { AddBalanceModal } from '../components/Accounts/AddBalanceModal'
import { AccountForm } from '../components/Accounts/AccountForm'
import { TypeIcon } from '../components/UI/TypeIcon'
import {
  formatCurrency,
  getLatestBalancePerAccount,
} from '../lib/utils'
import type { Account } from '../types/finance'

type TimeRange = '1m' | '3m' | '6m' | '1y' | '2y' | '3y' | '4y' | '5y' | '10y'

const TIME_RANGE_DAYS: Record<TimeRange, number> = {
  '1m': 30, '3m': 90, '6m': 180, '1y': 365, '2y': 730, '3y': 1095, '4y': 1460, '5y': 1825, '10y': 3650,
}

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  '1m': '1M', '3m': '3M', '6m': '6M', '1y': '1J', '2y': '2J', '3y': '3J', '4y': '4J', '5y': '5J', '10y': '10J',
}

export function Dashboard() {
  const { accounts, createAccount, loading: accountsLoading } = useAccounts()
  const { entries, addEntry, loading: entriesLoading } = useBalanceEntries()
  const navigate = useNavigate()

  const [timeRange, setTimeRange] = useState<TimeRange>('5y')
  const [addBalanceFor, setAddBalanceFor] = useState<Account | null>(null)
  const [showCreateAccount, setShowCreateAccount] = useState(false)

  const latestBalances = useMemo(() => getLatestBalancePerAccount(entries), [entries])
  const activeAccounts = accounts.filter((a) => !a.is_closed)

  const totalWealth = useMemo(
    () => activeAccounts.reduce((sum, a) => sum + (latestBalances[a.id] ?? 0), 0),
    [activeAccounts, latestBalances],
  )

  const wealthLastMonth = useMemo(() => {
    const cutoff = new Date()
    cutoff.setMonth(cutoff.getMonth() - 1)
    const old = getLatestBalancePerAccount(entries, cutoff)
    return activeAccounts.reduce((sum, a) => sum + (old[a.id] ?? 0), 0)
  }, [activeAccounts, entries])

  const wealthDeltaMonth = totalWealth - wealthLastMonth
  const wealthDeltaPctMonth = wealthLastMonth !== 0 ? (wealthDeltaMonth / Math.abs(wealthLastMonth)) * 100 : 0

  const avgMonthlyChange = useMemo(() => {
    if (entries.length < 2) return 0
    const firstDate = new Date(Math.min(...entries.map(e => new Date(e.recorded_at).getTime())))
    const months = Math.max(1, (new Date().getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44))
    const totalChange = totalWealth - (entries[0]?.amount || 0) // Simple approximation
    return totalChange / months
  }, [entries, totalWealth])

  const loading = accountsLoading || entriesLoading

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Finanz-Dashboard</h1>
          <p className="text-gray-500 mt-1">Willkommen zurück! Hier ist dein aktueller Stand.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => setShowCreateAccount(true)} className="rounded-xl">
            <Plus size={18} className="mr-2" />
            Konto hinzufügen
          </Button>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="Gesamtvermögen" 
          value={formatCurrency(totalWealth)} 
          icon={TrendingUp}
          trend={{ value: wealthDeltaPctMonth, label: 'letzter Monat' }}
        />
        <MetricCard 
          title="Ø Monatswachstum" 
          value={formatCurrency(avgMonthlyChange)} 
          icon={ArrowUpRight}
          subtitle="Basierend auf Historie"
        />
        <MetricCard 
          title="Aktive Konten" 
          value={activeAccounts.length} 
          icon={BarChart3}
          subtitle={`${accounts.length - activeAccounts.length} geschlossene Konten`}
        />
        <MetricCard 
          title="Letzte Änderung" 
          value={formatCurrency(wealthDeltaMonth)} 
          icon={Calendar}
          subtitle="In den letzten 30 Tagen"
        />
      </div>

      {/* Main Chart Section */}
      <Card className="p-6 md:p-8 bg-white/[0.02] border-white/5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <TrendingUp size={20} className="text-accent-400" />
              Vermögensentwicklung
            </h2>
            <p className="text-gray-500 text-sm mt-1">Historischer Verlauf aller Konten</p>
          </div>
          <div className="flex bg-white/5 p-1 rounded-xl self-start">
            {(Object.keys(TIME_RANGE_DAYS) as TimeRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  timeRange === r
                    ? 'bg-accent-500 text-white shadow-lg'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
              >
                {TIME_RANGE_LABELS[r]}
              </button>
            ))}
          </div>
        </div>
        <NetWorthChart accounts={accounts} entries={entries} days={TIME_RANGE_DAYS[timeRange]} />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Account List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Deine Konten</h2>
            <button onClick={() => navigate('/accounts')} className="text-accent-400 text-xs font-bold hover:underline">
              Alle verwalten
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeAccounts.map((account) => {
              const balance = latestBalances[account.id] ?? 0
              return (
                <div
                  key={account.id}
                  onClick={() => navigate(`/accounts/${account.id}`)}
                  className="glass group p-5 cursor-pointer hover:bg-white/10 transition-all border border-white/5 hover:border-accent-500/30 rounded-2xl"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-inner"
                        style={{ backgroundColor: account.color || '#6366f1' }}
                      >
                        <TypeIcon type={account.type} size={20} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white leading-none">{account.name}</h3>
                        <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-tight">{account.type}</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-700 group-hover:text-accent-400 group-hover:translate-x-1 transition-all" />
                  </div>
                  <div className="flex items-end justify-between">
                    <p className="text-2xl font-bold text-white tracking-tight">
                      {formatCurrency(balance)}
                    </p>
                    <button
                      onClick={(e) => { e.stopPropagation(); setAddBalanceFor(account) }}
                      className="text-[10px] bg-white/5 hover:bg-accent-500/20 text-gray-400 hover:text-accent-300 font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Plus size={12} />
                      Aktualisieren
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: Distributions */}
        <div className="space-y-6">
          <Card className="p-6 border-white/5 bg-white/[0.01]">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <PieIcon size={16} className="text-accent-400" />
              Aufteilung
            </h3>
            <AllocationChart accounts={accounts} entries={entries} />
          </Card>
          
          <Card className="p-6 border-white/5 bg-white/[0.01]">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Target size={16} className="text-emerald-400" />
              Entwicklung Monat
            </h3>
            <MonthlyChangeChart entries={entries} />
          </Card>
        </div>
      </div>

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
