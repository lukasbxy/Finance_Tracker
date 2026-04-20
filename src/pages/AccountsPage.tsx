import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Plus, Wallet, CheckCircle, RotateCcw, Trash2, Pencil,
  ChevronDown, ChevronRight as ChevronRightIcon,
  GripVertical, ArrowUpDown, Check, RefreshCw,
} from 'lucide-react'
import { useAccounts } from '../hooks/useAccounts'
import { useBalanceEntries } from '../hooks/useBalanceEntries'
import { useUserSettings } from '../hooks/useUserSettings'
import { Button } from '../components/UI/Button'
import { AccountForm } from '../components/Accounts/AccountForm'
import { CloseAccountModal } from '../components/Accounts/CloseAccountModal'
import { AddBalanceModal } from '../components/Accounts/AddBalanceModal'
import { TypeIcon } from '../components/UI/TypeIcon'
import { formatCurrency, formatDate, getLatestBalancePerAccount } from '../lib/utils'
import type { Account } from '../types/finance'

// ── SortableItem wrapper ────────────────────────────────────────────────────

interface SortableItemProps {
  id: string
  sortMode: boolean
  children: React.ReactNode
}

function SortableItem({ id, sortMode, children }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center ${isDragging ? 'opacity-40 relative z-50' : ''}`}
    >
      {sortMode && (
        <button
          {...attributes}
          {...listeners}
          className="p-2 text-gray-600 hover:text-gray-400 cursor-grab active:cursor-grabbing touch-none shrink-0 select-none"
          tabIndex={-1}
        >
          <GripVertical size={16} />
        </button>
      )}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}

// ── AccountRow ──────────────────────────────────────────────────────────────

interface AccountRowProps {
  account: Account
  balance: number | undefined
  updated: string | undefined
  sortMode: boolean
  onEdit: (account: Account) => void
  setAddBalanceFor: (account: Account) => void
  setCloseTarget: (account: Account) => void
  reopenAccount: (id: string) => Promise<void>
  deleteAccount: (id: string) => Promise<void>
  navigate: (path: string) => void
}

function AccountRow({
  account, balance, updated, sortMode,
  onEdit, setAddBalanceFor, setCloseTarget, reopenAccount, deleteAccount, navigate,
}: AccountRowProps) {
  return (
    <motion.div
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
        <div
          className={`flex items-center gap-2 ${!sortMode ? 'cursor-pointer' : ''}`}
          onClick={() => !sortMode && navigate(`/accounts/${account.id}`)}
        >
          <p className="font-bold text-white truncate text-sm">{account.name}</p>
          {account.is_closed && (
            <span className="text-[10px] font-bold text-gray-500 bg-white/5 border border-white/10 rounded-lg px-2 py-0.5 uppercase tracking-wider shrink-0">geschlossen</span>
          )}
        </div>
        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-tight">
          {account.type}{updated && ` · ${formatDate(updated)}`}
        </p>
      </div>

      <div className="text-right shrink-0">
        <p className={`font-bold tracking-tight ${balance !== undefined ? 'text-white' : 'text-gray-600'}`}>
          {balance !== undefined ? formatCurrency(balance) : '—'}
        </p>
      </div>

      {!sortMode && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
          <button onClick={() => onEdit(account)} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors" title="Konto bearbeiten">
            <Pencil size={14} />
          </button>
          {!account.is_closed && (
            <>
              <button onClick={() => setAddBalanceFor(account)} className="p-1.5 rounded-lg text-gray-500 hover:text-accent-400 hover:bg-accent-500/10 transition-colors" title="Stand aktualisieren">
                <Plus size={15} />
              </button>
              <button onClick={() => setCloseTarget(account)} className="p-1.5 rounded-lg text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors" title="Konto schließen">
                <CheckCircle size={15} />
              </button>
            </>
          )}
          {account.is_closed && (
            <button onClick={() => reopenAccount(account.id)} className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors" title="Konto wieder öffnen">
              <RotateCcw size={15} />
            </button>
          )}
          <button
            onClick={() => { if (confirm(`"${account.name}" wirklich löschen? Alle Einträge gehen verloren.`)) deleteAccount(account.id) }}
            className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Konto löschen"
          >
            <Trash2 size={15} />
          </button>
        </div>
      )}
    </motion.div>
  )
}

// ── Page ────────────────────────────────────────────────────────────────────

export function AccountsPage() {
  const navigate = useNavigate()
  const { accounts, loading: accountsLoading, createAccount, updateAccount, closeAccount, reopenAccount, deleteAccount } = useAccounts()
  const { entries, addEntry } = useBalanceEntries()
  const { settings, loading: settingsLoading, updateSettings, resetSettings } = useUserSettings()

  const [showCreate, setShowCreate] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [closeTarget, setCloseTarget] = useState<Account | null>(null)
  const [addBalanceFor, setAddBalanceFor] = useState<Account | null>(null)
  const [showClosed, setShowClosed] = useState(false)
  const [sortMode, setSortMode] = useState(false)
  const [localOrder, setLocalOrder] = useState<string[]>([])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const latestBalances = useMemo(() => getLatestBalancePerAccount(entries), [entries])
  const lastUpdated = useMemo(() => {
    const map: Record<string, string> = {}
    for (const e of entries) {
      if (!map[e.account_id] || e.recorded_at > map[e.account_id]) map[e.account_id] = e.recorded_at
    }
    return map
  }, [entries])

  const active = useMemo(() => {
    const raw = accounts.filter((a) => !a.is_closed)
    const order = settings.accountOrder
    if (!order?.length) return raw
    const idx = new Map(order.map((id, i) => [id, i]))
    return [...raw].sort((a, b) => (idx.get(a.id) ?? 9999) - (idx.get(b.id) ?? 9999))
  }, [accounts, settings.accountOrder])

  const closed = accounts.filter((a) => a.is_closed)

  function enterSortMode() {
    setLocalOrder(active.map((a) => a.id))
    setSortMode(true)
  }

  async function saveSortOrder() {
    await updateSettings({ accountOrder: localOrder })
    setSortMode(false)
  }

  async function resetSortOrder() {
    await resetSettings('accountOrder')
    setSortMode(false)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active: dragActive, over } = event
    if (over && dragActive.id !== over.id) {
      setLocalOrder((prev) => {
        const oldIdx = prev.indexOf(String(dragActive.id))
        const newIdx = prev.indexOf(String(over.id))
        return arrayMove(prev, oldIdx, newIdx)
      })
    }
  }

  const sortedLocal = useMemo(() => {
    if (!sortMode) return active
    const idx = new Map(localOrder.map((id, i) => [id, i]))
    return [...active].sort((a, b) => (idx.get(a.id) ?? 9999) - (idx.get(b.id) ?? 9999))
  }, [sortMode, active, localOrder])

  if (accountsLoading || settingsLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:px-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Deine Konten</h1>
          <p className="text-gray-500 mt-1">{active.length} aktive Konten</p>
        </div>
        <div className="flex items-center gap-2">
          {sortMode ? (
            <>
              <button
                onClick={resetSortOrder}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Standardreihenfolge wiederherstellen"
              >
                <RefreshCw size={13} />
                Standard
              </button>
              <Button onClick={saveSortOrder} className="rounded-xl">
                <Check size={15} className="mr-1.5" />
                Fertig
              </Button>
            </>
          ) : (
            <>
              {active.length > 1 && (
                <button
                  onClick={enterSortMode}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/10 transition-colors border border-white/5"
                  title="Reihenfolge anpassen"
                >
                  <ArrowUpDown size={13} />
                  Sortieren
                </button>
              )}
              <Button onClick={() => setShowCreate(true)} className="rounded-xl">
                <Plus size={18} className="mr-2" />
                Konto anlegen
              </Button>
            </>
          )}
        </div>
      </div>

      {sortMode && (
        <motion.p
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-gray-500 text-center"
        >
          Ziehe Konten in die gewünschte Reihenfolge · Gilt auch für das Dashboard
        </motion.p>
      )}

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
          {/* Active accounts */}
          <div className="space-y-2">
            {!sortMode && <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">Aktiv</h2>}
            <div className={`glass rounded-2xl p-2 border-white/5 ${sortMode ? 'border-accent-500/20 ring-1 ring-accent-500/10' : ''}`}>
              {sortMode ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={sortedLocal.map((a) => a.id)} strategy={verticalListSortingStrategy}>
                    {sortedLocal.map((a) => (
                      <SortableItem key={a.id} id={a.id} sortMode>
                        <AccountRow
                          account={a}
                          balance={latestBalances[a.id]}
                          updated={lastUpdated[a.id]}
                          sortMode
                          onEdit={setEditingAccount}
                          setAddBalanceFor={setAddBalanceFor}
                          setCloseTarget={setCloseTarget}
                          reopenAccount={reopenAccount}
                          deleteAccount={deleteAccount}
                          navigate={navigate}
                        />
                      </SortableItem>
                    ))}
                  </SortableContext>
                </DndContext>
              ) : (
                <AnimatePresence mode="popLayout">
                  {active.map((a) => (
                    <AccountRow
                      key={a.id}
                      account={a}
                      balance={latestBalances[a.id]}
                      updated={lastUpdated[a.id]}
                      sortMode={false}
                      onEdit={setEditingAccount}
                      setAddBalanceFor={setAddBalanceFor}
                      setCloseTarget={setCloseTarget}
                      reopenAccount={reopenAccount}
                      deleteAccount={deleteAccount}
                      navigate={navigate}
                    />
                  ))}
                </AnimatePresence>
              )}
              {active.length === 0 && (
                <p className="text-gray-600 text-sm text-center py-8">Keine aktiven Konten</p>
              )}
            </div>
          </div>

          {/* Closed accounts */}
          {!sortMode && closed.length > 0 && (
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
                          sortMode={false}
                          onEdit={setEditingAccount}
                          setAddBalanceFor={setAddBalanceFor}
                          setCloseTarget={setCloseTarget}
                          reopenAccount={reopenAccount}
                          deleteAccount={deleteAccount}
                          navigate={navigate}
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

      {/* Modals */}
      <AccountForm
        key={editingAccount ? editingAccount.id : 'new'}
        open={showCreate || !!editingAccount}
        onClose={() => { setShowCreate(false); setEditingAccount(null) }}
        onSave={async (data) => {
          if (editingAccount) await updateAccount(editingAccount.id, data)
          else await createAccount(data)
        }}
        initial={editingAccount || undefined}
        title={editingAccount ? 'Konto bearbeiten' : 'Konto anlegen'}
      />
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
