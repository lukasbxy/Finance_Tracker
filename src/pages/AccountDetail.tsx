import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus, Trash2, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useAccounts } from '../hooks/useAccounts'
import { useBalanceEntries } from '../hooks/useBalanceEntries'
import { Button } from '../components/UI/Button'
import { Card } from '../components/UI/Card'
import { AddBalanceModal } from '../components/Accounts/AddBalanceModal'
import { AccountHistoryChart } from '../components/Charts/AccountHistoryChart'
import { formatCurrency, formatDate } from '../lib/utils'
import { TypeIcon } from '../components/UI/TypeIcon'

export function AccountDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { accounts } = useAccounts()
  const { entries, loading, addEntry, deleteEntry } = useBalanceEntries(id)

  const [showAddBalance, setShowAddBalance] = useState(false)

  const account = accounts.find((a) => a.id === id)

  const currentBalance = useMemo(() => {
    if (entries.length === 0) return null
    return Number(entries[0].amount)
  }, [entries])

  const prevBalance = useMemo(() => {
    if (entries.length < 2) return null
    return Number(entries[1].amount)
  }, [entries])

  const delta = currentBalance !== null && prevBalance !== null ? currentBalance - prevBalance : null

  if (!account) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Konto nicht gefunden.</p>
          <Button onClick={() => navigate('/accounts')}>Zurück</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:px-6">
      {/* Header */}
      <motion.div
        className="flex items-center gap-4 mb-8"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <button
          onClick={() => navigate('/accounts')}
          className="p-2.5 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-all border border-white/5"
        >
          <ArrowLeft size={18} />
        </button>
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg"
          style={{ backgroundColor: account.color || '#6366f1' }}
        >
          <TypeIcon type={account.type} size={24} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight truncate">{account.name}</h1>
            {account.is_closed && (
              <span className="text-[10px] font-bold text-gray-500 bg-white/5 border border-white/10 rounded-lg px-2 py-0.5 uppercase tracking-wider shrink-0">geschlossen</span>
            )}
          </div>
          <p className="text-gray-500 text-xs font-medium uppercase tracking-widest mt-1">{account.type}</p>
        </div>
        {!account.is_closed && (
          <Button onClick={() => setShowAddBalance(true)} className="rounded-xl shadow-lg shadow-accent-500/20">
            <Plus size={18} className="mr-1.5" />
            Eintragen
          </Button>
        )}
      </motion.div>

      {/* Balance Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <Card className="col-span-2 sm:col-span-1 bg-gradient-to-br from-accent-500/15 to-transparent border-accent-500/20">
          <p className="text-xs text-gray-400 mb-1">Aktueller Stand</p>
          <p className="text-2xl font-bold text-white">
            {currentBalance !== null ? formatCurrency(currentBalance) : '—'}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-gray-400 mb-1">Veränderung</p>
          <div className={`flex items-center gap-1 text-lg font-semibold ${
            delta === null ? 'text-gray-600' :
            delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-red-400' : 'text-gray-400'
          }`}>
            {delta === null ? <Minus size={18} /> : delta > 0 ? <TrendingUp size={18} /> : delta < 0 ? <TrendingDown size={18} /> : <Minus size={18} />}
            {delta !== null ? (delta >= 0 ? '+' : '') + formatCurrency(delta) : '—'}
          </div>
          <p className="text-xs text-gray-600 mt-0.5">zum vorigen Eintrag</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-400 mb-1">Einträge</p>
          <p className="text-2xl font-bold text-white">{entries.length}</p>
        </Card>
      </div>

      {/* Chart */}
      {entries.length >= 2 && (
        <Card animate={false} className="mb-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Verlauf</h3>
          <AccountHistoryChart account={account} entries={entries} />
        </Card>
      )}

      {/* History Table */}
      <Card animate={false}>
        <h3 className="text-sm font-semibold text-gray-300 mb-4">Alle Einträge</h3>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 text-sm mb-3">Noch keine Einträge.</p>
            {!account.is_closed && (
              <Button size="sm" onClick={() => setShowAddBalance(true)}>
                <Plus size={14} />
                Ersten Stand eintragen
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {entries.map((entry, i) => {
              const prev = entries[i + 1]
              const entryDelta = prev ? Number(entry.amount) - Number(prev.amount) : null

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors group"
                >
                  <div
                    className="w-1.5 h-8 rounded-full shrink-0"
                    style={{ backgroundColor: account.color ?? '#6366f1', opacity: 0.6 }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{formatCurrency(Number(entry.amount))}</p>
                    {entry.note && <p className="text-xs text-gray-500 truncate">{entry.note}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-400">{formatDate(entry.recorded_at)}</p>
                    {entryDelta !== null && (
                      <p className={`text-xs font-medium ${entryDelta > 0 ? 'text-emerald-500' : entryDelta < 0 ? 'text-red-500' : 'text-gray-600'}`}>
                        {entryDelta > 0 ? '+' : ''}{formatCurrency(entryDelta)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Eintrag löschen?')) deleteEntry(entry.id)
                    }}
                    className="p-1.5 rounded-lg text-gray-700 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </motion.div>
              )
            })}
          </div>
        )}
      </Card>

      <AddBalanceModal
        open={showAddBalance}
        onClose={() => setShowAddBalance(false)}
        account={account}
        onAdd={addEntry}
      />
    </div>
  )
}
