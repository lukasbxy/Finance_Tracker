import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Wallet, ChevronRight, CheckCircle, RotateCcw, Trash2 } from 'lucide-react'
import { useAccounts } from '../hooks/useAccounts'
import { useBalanceEntries } from '../hooks/useBalanceEntries'
import { Button } from '../components/UI/Button'
import { AccountForm } from '../components/Accounts/AccountForm'
import { CloseAccountModal } from '../components/Accounts/CloseAccountModal'
import { AddBalanceModal } from '../components/Accounts/AddBalanceModal'
import { formatCurrency, formatDate, getLatestBalancePerAccount, getAccountTypeIcon } from '../lib/utils'
import type { Account } from '../types/finance'
import { useMemo } from 'react'

export function AccountsPage() {
  const navigate = useNavigate()
  const { accounts, loading, createAccount, closeAccount, reopenAccount, deleteAccount } = useAccounts()
  const { entries, addEntry } = useBalanceEntries()

  const [showCreate, setShowCreate] = useState(false)
  const [closeTarget, setCloseTarget] = useState<Account | null>(null)
  const [addBalanceFor, setAddBalanceFor] = useState<Account | null>(null)
  const [showClosed, setShowClosed] = useState(false)

  const latestBalances = useMemo(() => getLatestBalancePerAccount(entries), [entries])
  const lastUpdated = useMemo(() => {
    const map: Record<string, string> = {}
    for (const e of entries) {
      if (!map[e.account_id] || e.recorded_at > map[e.account_id]) {
        map[e.account_id] = e.recorded_at
      }
    }
    return map
  }, [entries])

  const active = accounts.filter((a) => !a.is_closed)
  const closed = accounts.filter((a) => a.is_closed)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  function AccountRow({ account }: { account: Account }) {
    const balance = latestBalances[account.id]
    const updated = lastUpdated[account.id]

    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 10 }}
        className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group"
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ backgroundColor: `${account.color ?? '#6366f1'}20` }}
        >
          {account.icon ?? getAccountTypeIcon(account.type)}
        </div>

        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => navigate(`/accounts/${account.id}`)}
        >
          <div className="flex items-center gap-2">
            <p className="font-medium text-white truncate">{account.name}</p>
            {account.is_closed && (
              <span className="text-xs text-gray-500 bg-gray-800 rounded-full px-2 py-0.5">geschlossen</span>
            )}
          </div>
          <p className="text-xs text-gray-500">
            {account.type}
            {updated && ` · Zuletzt ${formatDate(updated)}`}
          </p>
        </div>

        <div className="text-right shrink-0">
          <p className={`font-semibold ${balance !== undefined ? 'text-white' : 'text-gray-600'}`}>
            {balance !== undefined ? formatCurrency(balance) : '—'}
          </p>
        </div>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {!account.is_closed && (
            <>
              <button
                onClick={() => setAddBalanceFor(account)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-accent-400 hover:bg-accent-500/10 transition-colors"
                title="Stand aktualisieren"
              >
                <Plus size={15} />
              </button>
              <button
                onClick={() => setCloseTarget(account)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                title="Konto schließen"
              >
                <CheckCircle size={15} />
              </button>
            </>
          )}
          {account.is_closed && (
            <button
              onClick={() => reopenAccount(account.id)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
              title="Konto wieder öffnen"
            >
              <RotateCcw size={15} />
            </button>
          )}
          <button
            onClick={() => navigate(`/accounts/${account.id}`)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ChevronRight size={15} />
          </button>
          <button
            onClick={() => {
              if (confirm(`"${account.name}" wirklich löschen? Alle Einträge gehen verloren.`)) {
                deleteAccount(account.id)
              }
            }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Konto löschen"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:px-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Konten</h1>
          <p className="text-gray-500 text-sm mt-0.5">{active.length} aktiv{closed.length > 0 && `, ${closed.length} geschlossen`}</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          Neues Konto
        </Button>
      </div>

      {accounts.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Wallet size={40} className="text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">Noch keine Konten angelegt.</p>
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} />
            Konto anlegen
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Active */}
          <div className="glass rounded-2xl p-2">
            <AnimatePresence>
              {active.map((a) => <AccountRow key={a.id} account={a} />)}
            </AnimatePresence>
            {active.length === 0 && (
              <p className="text-gray-600 text-sm text-center py-4">Keine aktiven Konten</p>
            )}
          </div>

          {/* Closed */}
          {closed.length > 0 && (
            <div>
              <button
                onClick={() => setShowClosed((v) => !v)}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors mb-2 flex items-center gap-1.5"
              >
                <span>{showClosed ? '▼' : '▶'}</span>
                Geschlossene Konten ({closed.length})
              </button>
              <AnimatePresence>
                {showClosed && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="glass rounded-2xl p-2 opacity-60"
                  >
                    {closed.map((a) => <AccountRow key={a.id} account={a} />)}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      <AccountForm open={showCreate} onClose={() => setShowCreate(false)} onSave={createAccount} />

      {closeTarget && (
        <CloseAccountModal
          open={!!closeTarget}
          onClose={() => setCloseTarget(null)}
          account={closeTarget}
          onClose_={closeAccount}
        />
      )}

      {addBalanceFor && (
        <AddBalanceModal
          open={!!addBalanceFor}
          onClose={() => setAddBalanceFor(null)}
          account={addBalanceFor}
          onAdd={addEntry}
        />
      )}
    </div>
  )
}
