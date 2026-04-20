import { useState, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Wallet, 
  CheckCircle, 
  RotateCcw, 
  Trash2, 
  Pencil, 
  Check, 
  X, 
  ChevronDown, 
  ChevronRight as ChevronRightIcon 
} from 'lucide-react'
import { useAccounts } from '../hooks/useAccounts'
import { useBalanceEntries } from '../hooks/useBalanceEntries'
import { Button } from '../components/UI/Button'
import { AccountForm } from '../components/Accounts/AccountForm'
import { CloseAccountModal } from '../components/Accounts/CloseAccountModal'
import { AddBalanceModal } from '../components/Accounts/AddBalanceModal'
import { TypeIcon } from '../components/UI/TypeIcon'
import { formatCurrency, formatDate, getLatestBalancePerAccount } from '../lib/utils'
import type { Account } from '../types/finance'

interface AccountRowProps {
  account: Account
  balance: number | undefined
  updated: string | undefined
  isEditing: boolean
  editName: string
  setEditName: (v: string) => void
  commitEdit: (id: string) => Promise<void>
  setEditingId: (id: string | null) => void
  startEdit: (account: Account) => void
  setAddBalanceFor: (account: Account) => void
  setCloseTarget: (account: Account) => void
  reopenAccount: (id: string) => Promise<void>
  deleteAccount: (id: string) => Promise<void>
  navigate: (path: string) => void
  editInputRef: React.RefObject<HTMLInputElement>
}

function AccountRow({ 
  account, 
  balance, 
  updated, 
  isEditing, 
  editName, 
  setEditName, 
  commitEdit, 
  setEditingId,
  startEdit,
  setAddBalanceFor,
  setCloseTarget,
  reopenAccount,
  deleteAccount,
  navigate,
  editInputRef
}: AccountRowProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-3 md:gap-4 p-2 md:p-3 rounded-2xl hover:bg-white/5 transition-all group border border-transparent hover:border-white/5"
    >
      <div
        className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-white shadow-inner shrink-0"
        style={{ backgroundColor: account.color || '#6366f1' }}
      >
        <TypeIcon type={account.type} size={16} className="md:w-[18px] md:h-[18px]" />
      </div>

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-1.5">
            <input
              ref={editInputRef}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitEdit(account.id)
                if (e.key === 'Escape') setEditingId(null)
              }}
              className="bg-white/10 border border-white/20 rounded-lg px-2 py-0.5 text-sm text-white outline-none focus:border-accent-500/60 w-40"
            />
            <button onClick={() => commitEdit(account.id)} className="p-1 text-emerald-400 hover:text-emerald-300">
              <Check size={14} />
            </button>
            <button onClick={() => setEditingId(null)} className="p-1 text-gray-500 hover:text-gray-300">
              <X size={14} />
            </button>
          </div>
        ) : (
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate(`/accounts/${account.id}`)}
          >
            <p className="font-bold text-white truncate text-sm">{account.name}</p>
            {account.is_closed && (
              <span className="text-[10px] font-bold text-gray-500 bg-white/5 border border-white/10 rounded-lg px-2 py-0.5 uppercase tracking-wider shrink-0">geschlossen</span>
            )}
          </div>
        )}
        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-tight">
          {account.type}
          {updated && ` · ${formatDate(updated)}`}
        </p>
      </div>

      <div className="text-right shrink-0">
        <p className={`font-bold tracking-tight ${balance !== undefined ? 'text-white' : 'text-gray-600'}`}>
          {balance !== undefined ? formatCurrency(balance) : '—'}
        </p>
      </div>

      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
        <button
          onClick={() => startEdit(account)}
          className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
          title="Name bearbeiten"
        >
          <Pencil size={14} />
        </button>
        {!account.is_closed && (
          <>
            <button
              onClick={() => setAddBalanceFor(account)}
              className="p-1.5 rounded-lg text-gray-500 hover:text-accent-400 hover:bg-accent-500/10 transition-colors"
              title="Stand aktualisieren"
            >
              <Plus size={15} />
            </button>
            <button
              onClick={() => setCloseTarget(account)}
              className="p-1.5 rounded-lg text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
              title="Konto schließen"
            >
              <CheckCircle size={15} />
            </button>
          </>
        )}
        {account.is_closed && (
          <button
            onClick={() => reopenAccount(account.id)}
            className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
            title="Konto wieder öffnen"
          >
            <RotateCcw size={15} />
          </button>
        )}
        <button
          onClick={() => {
            if (confirm(`"${account.name}" wirklich löschen? Alle Einträge gehen verloren.`)) {
              deleteAccount(account.id)
            }
          }}
          className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          title="Konto löschen"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </motion.div>
  )
}

export function AccountsPage() {
  const navigate = useNavigate()
  const { accounts, loading, createAccount, updateAccount, closeAccount, reopenAccount, deleteAccount } = useAccounts()
  const { entries, addEntry } = useBalanceEntries()

  const [showCreate, setShowCreate] = useState(false)
  const [closeTarget, setCloseTarget] = useState<Account | null>(null)
  const [addBalanceFor, setAddBalanceFor] = useState<Account | null>(null)
  const [showClosed, setShowClosed] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const editInputRef = useRef<HTMLInputElement>(null)

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

  function startEdit(account: Account) {
    setEditingId(account.id)
    setEditName(account.name)
    setTimeout(() => editInputRef.current?.focus(), 50)
  }

  async function commitEdit(id: string) {
    const trimmed = editName.trim()
    if (trimmed && trimmed !== accounts.find((a) => a.id === id)?.name) {
      await updateAccount(id, { name: trimmed })
    }
    setEditingId(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:px-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Deine Konten</h1>
          <p className="text-gray-500 mt-1">{active.length} aktive Konten</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="rounded-xl">
          <Plus size={18} className="mr-2" />
          Konto anlegen
        </Button>
      </div>

      {accounts.length === 0 ? (
        <div className="glass rounded-3xl p-16 text-center border-white/5">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 text-gray-500">
            <Wallet size={32} />
          </div>
          <p className="text-gray-400 font-medium mb-6">Noch keine Konten angelegt.</p>
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={16} className="mr-2" />
            Erstes Konto anlegen
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Aktiv</h2>
            <div className="glass rounded-2xl p-2 border-white/5">
              <AnimatePresence mode="popLayout">
                {active.map((a) => (
                  <AccountRow 
                    key={a.id} 
                    account={a}
                    balance={latestBalances[a.id]}
                    updated={lastUpdated[a.id]}
                    isEditing={editingId === a.id}
                    editName={editName}
                    setEditName={setEditName}
                    commitEdit={commitEdit}
                    setEditingId={setEditingId}
                    startEdit={startEdit}
                    setAddBalanceFor={setAddBalanceFor}
                    setCloseTarget={setCloseTarget}
                    reopenAccount={reopenAccount}
                    deleteAccount={deleteAccount}
                    navigate={navigate}
                    editInputRef={editInputRef}
                  />
                ))}
              </AnimatePresence>
              {active.length === 0 && (
                <p className="text-gray-600 text-sm text-center py-8">Keine aktiven Konten</p>
              )}
            </div>
          </div>

          {/* Closed */}
          {closed.length > 0 && (
            <div className="space-y-2">
              <button
                onClick={() => setShowClosed((v) => !v)}
                className="text-xs font-bold text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-2 px-1 uppercase tracking-widest"
              >
                {showClosed ? <ChevronDown size={14} /> : <ChevronRightIcon size={14} />}
                Geschlossen ({closed.length})
              </button>
              <AnimatePresence>
                {showClosed && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="glass rounded-2xl p-2 border-white/5 opacity-60 overflow-hidden"
                  >
                    <AnimatePresence mode="popLayout">
                      {closed.map((a) => (
                        <AccountRow 
                          key={a.id} 
                          account={a}
                          balance={latestBalances[a.id]}
                          updated={lastUpdated[a.id]}
                          isEditing={editingId === a.id}
                          editName={editName}
                          setEditName={setEditName}
                          commitEdit={commitEdit}
                          setEditingId={setEditingId}
                          startEdit={startEdit}
                          setAddBalanceFor={setAddBalanceFor}
                          setCloseTarget={setCloseTarget}
                          reopenAccount={reopenAccount}
                          deleteAccount={deleteAccount}
                          navigate={navigate}
                          editInputRef={editInputRef}
                        />
                      ))}
                    </AnimatePresence>
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
