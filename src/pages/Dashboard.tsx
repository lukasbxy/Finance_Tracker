import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
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
  TrendingUp,
  Plus,
  ChevronRight,
  BarChart3,
  PieChart as PieIcon,
  Calendar,
  ArrowUpRight,
  Target,
  GripVertical,
  LayoutDashboard,
  Check,
  RefreshCw,
} from 'lucide-react'
import { useAccounts } from '../hooks/useAccounts'
import { useBalanceEntries } from '../hooks/useBalanceEntries'
import { useUserSettings } from '../hooks/useUserSettings'
import { Card } from '../components/UI/Card'
import { Button } from '../components/UI/Button'
import { NetWorthChart } from '../components/Charts/NetWorthChart'
import { AllocationChart } from '../components/Charts/AllocationChart'
import { MonthlyChangeChart } from '../components/Charts/MonthlyChangeChart'
import { MetricCard } from '../components/UI/MetricCard'
import { YearlyPerformance } from '../components/Analytics/YearlyPerformance'
import { AssetClassAnalysis } from '../components/Analytics/AssetClassAnalysis'
import { ProjectedWealth } from '../components/Analytics/ProjectedWealth'
import { TopMovers } from '../components/Analytics/TopMovers'
import { FinancialFreedom } from '../components/Analytics/FinancialFreedom'
import { PortfolioHealth } from '../components/Analytics/PortfolioHealth'
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

// ── Section IDs & default order ────────────────────────────────────────────

const DEFAULT_SECTION_ORDER = ['metrics', 'chart', 'accounts', 'analytics', 'insights'] as const
type SectionId = typeof DEFAULT_SECTION_ORDER[number]

const SECTION_LABELS: Record<SectionId, string> = {
  metrics: 'Kennzahlen',
  chart: 'Vermögensverlauf',
  accounts: 'Konten & Aufteilung',
  analytics: 'Detaillierte Auswertungen',
  insights: 'Portfolio-Einblicke',
}

// ── SortableSection ─────────────────────────────────────────────────────────

interface SortableSectionProps {
  id: string
  sortMode: boolean
  children: React.ReactNode
}

function SortableSection({ id, sortMode, children }: SortableSectionProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative ${isDragging ? 'opacity-50 z-50' : ''} ${sortMode ? 'rounded-2xl ring-1 ring-white/10 p-1' : ''}`}
    >
      {sortMode && (
        <div className="flex items-center gap-2 mb-2 px-2 pt-1">
          <button
            {...attributes}
            {...listeners}
            className="p-1.5 text-gray-500 hover:text-gray-300 cursor-grab active:cursor-grabbing touch-none select-none rounded-lg hover:bg-white/10 transition-colors"
            tabIndex={-1}
          >
            <GripVertical size={16} />
          </button>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest select-none">
            {SECTION_LABELS[id as SectionId]}
          </span>
        </div>
      )}
      <div className={sortMode ? 'pointer-events-none opacity-70' : ''}>{children}</div>
    </div>
  )
}

// ── Dashboard ───────────────────────────────────────────────────────────────

export function Dashboard() {
  const { accounts, createAccount, loading: accountsLoading } = useAccounts()
  const { entries, addEntry, loading: entriesLoading } = useBalanceEntries()
  const { settings, updateSettings, resetSettings } = useUserSettings()
  const navigate = useNavigate()

  const [timeRange, setTimeRange] = useState<TimeRange>('5y')
  const [addBalanceFor, setAddBalanceFor] = useState<Account | null>(null)
  const [showCreateAccount, setShowCreateAccount] = useState(false)
  const [sortMode, setSortMode] = useState(false)
  const [localOrder, setLocalOrder] = useState<string[]>([])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const latestBalances = useMemo(() => getLatestBalancePerAccount(entries), [entries])
  const activeAccounts = useMemo(() => {
    const raw = accounts.filter((a) => !a.is_closed)
    const order = settings.accountOrder
    if (!order?.length) return raw
    const idx = new Map(order.map((id, i) => [id, i]))
    return [...raw].sort((a, b) => (idx.get(a.id) ?? 9999) - (idx.get(b.id) ?? 9999))
  }, [accounts, settings.accountOrder])

  const totalWealth = useMemo(
    () => accounts.reduce((sum, a) => sum + (latestBalances[a.id] ?? 0), 0),
    [accounts, latestBalances],
  )

  const wealthLastMonth = useMemo(() => {
    const cutoff = new Date()
    cutoff.setMonth(cutoff.getMonth() - 1)
    const old = getLatestBalancePerAccount(entries, cutoff)
    return accounts.reduce((sum, a) => sum + (old[a.id] ?? 0), 0)
  }, [accounts, entries])

  const wealthDeltaMonth = totalWealth - wealthLastMonth
  const wealthDeltaPctMonth = wealthLastMonth !== 0 ? (wealthDeltaMonth / Math.abs(wealthLastMonth)) * 100 : 0

  const avgMonthlyChange = useMemo(() => {
    if (entries.length < 2) return 0
    const firstDate = new Date(Math.min(...entries.map(e => new Date(e.recorded_at).getTime())))
    const months = Math.max(1, (new Date().getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44))
    const totalChange = totalWealth - (entries[0]?.amount || 0)
    return totalChange / months
  }, [entries, totalWealth])

  const sectionOrder: string[] = useMemo(() => {
    const saved = settings.dashboardOrder
    if (saved?.length) return saved
    return [...DEFAULT_SECTION_ORDER]
  }, [settings.dashboardOrder])

  const displayOrder = sortMode ? localOrder : sectionOrder

  function enterSortMode() {
    setLocalOrder(sectionOrder)
    setSortMode(true)
  }

  async function saveSortOrder() {
    await updateSettings({ dashboardOrder: localOrder })
    setSortMode(false)
  }

  async function resetSortOrder() {
    await resetSettings('dashboardOrder')
    setSortMode(false)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setLocalOrder((prev) => {
        const oldIdx = prev.indexOf(active.id as string)
        const newIdx = prev.indexOf(over.id as string)
        return arrayMove(prev, oldIdx, newIdx)
      })
    }
  }

  const loading = accountsLoading || entriesLoading

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const sections: Record<string, React.ReactNode> = {
    metrics: (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
    ),

    chart: (
      <Card className="p-4 md:p-8 bg-white/[0.02] border-white/5">
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
    ),

    accounts: (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
    ),

    analytics: (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Detaillierte Auswertungen</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <YearlyPerformance entries={entries} />
          </div>
          <div className="space-y-8">
            <AssetClassAnalysis accounts={accounts} entries={entries} />
            <ProjectedWealth totalWealth={totalWealth} avgMonthlyChange={avgMonthlyChange} />
          </div>
        </div>
      </div>
    ),

    insights: (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <FinancialFreedom totalWealth={totalWealth} />
        <TopMovers accounts={accounts} entries={entries} />
        <PortfolioHealth accounts={accounts} entries={entries} />
      </div>
    ),
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
          {sortMode ? (
            <>
              <Button
                variant="secondary"
                onClick={resetSortOrder}
                className="rounded-xl text-gray-400"
              >
                <RefreshCw size={16} className="mr-2" />
                Standard
              </Button>
              <Button
                variant="primary"
                onClick={saveSortOrder}
                className="rounded-xl"
              >
                <Check size={16} className="mr-2" />
                Fertig
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" onClick={enterSortMode} className="rounded-xl">
                <LayoutDashboard size={16} className="mr-2" />
                Anpassen
              </Button>
              <Button variant="secondary" onClick={() => setShowCreateAccount(true)} className="rounded-xl">
                <Plus size={18} className="mr-2" />
                Konto hinzufügen
              </Button>
            </>
          )}
        </div>
      </div>

      {sortMode && (
        <p className="text-xs text-gray-500 -mt-4">
          Ziehe die Abschnitte in die gewünschte Reihenfolge. Klicken und halten zum Verschieben.
        </p>
      )}

      {/* Sections */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={displayOrder} strategy={verticalListSortingStrategy}>
          <div className="space-y-8">
            {displayOrder.map((sectionId) => (
              <SortableSection key={sectionId} id={sectionId} sortMode={sortMode}>
                {sections[sectionId]}
              </SortableSection>
            ))}
          </div>
        </SortableContext>
      </DndContext>

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
