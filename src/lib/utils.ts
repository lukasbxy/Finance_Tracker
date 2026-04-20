import { format, parseISO, startOfDay, eachDayOfInterval, subDays } from 'date-fns'
import { de } from 'date-fns/locale'
import type { BalanceEntry } from '../types/finance'

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), 'dd.MM.yyyy', { locale: de })
}

export function formatDateShort(dateStr: string): string {
  return format(parseISO(dateStr), 'dd.MM.yy', { locale: de })
}

export function todayISOString(): string {
  return new Date().toISOString().split('T')[0]
}

export function getLatestBalancePerAccount(
  entries: BalanceEntry[],
  asOf?: Date,
): Record<string, number> {
  const cutoff = asOf ? asOf.getTime() : Infinity
  const latest: Record<string, { amount: number; ts: number }> = {}

  for (const entry of entries) {
    const ts = new Date(entry.recorded_at).getTime()
    if (ts > cutoff) continue
    const existing = latest[entry.account_id]
    if (!existing || ts > existing.ts) {
      latest[entry.account_id] = { amount: Number(entry.amount), ts }
    }
  }

  return Object.fromEntries(
    Object.entries(latest).map(([k, v]) => [k, v.amount]),
  )
}

export function buildNetWorthTimeSeries(
  entries: BalanceEntry[],
  days = 365,
): { date: string; total: number; [key: string]: string | number }[] {
  if (entries.length === 0) return []

  const today = startOfDay(new Date())
  const start = subDays(today, days)

  const step = days <= 90 ? 1 : days <= 365 ? 3 : days <= 730 ? 7 : days <= 1825 ? 14 : 30
  const allDays = eachDayOfInterval({ start, end: today })
  const sampled = allDays.filter((_, i) => i % step === 0)
  if (sampled[sampled.length - 1]?.getTime() !== today.getTime()) sampled.push(today)

  return sampled.map((day) => {
    const balances = getLatestBalancePerAccount(entries, day)
    const total = Object.values(balances).reduce((sum, v) => sum + v, 0)
    return {
      date: format(day, 'yyyy-MM-dd'),
      total,
      ...balances,
    }
  })
}

export function buildMonthlyChangeSeries(
  entries: BalanceEntry[],
  months = 12,
): { month: string; change: number }[] {
  const result: { month: string; change: number }[] = []
  const today = new Date()

  for (let i = months - 1; i >= 0; i--) {
    const endDate = new Date(today.getFullYear(), today.getMonth() - i + 1, 0)
    const startDate = new Date(today.getFullYear(), today.getMonth() - i, 1)

    const endBalances = getLatestBalancePerAccount(entries, endDate)
    const startBalances = getLatestBalancePerAccount(entries, startDate)

    const endTotal = Object.values(endBalances).reduce((s, v) => s + v, 0)
    const startTotal = Object.values(startBalances).reduce((s, v) => s + v, 0)

    result.push({
      month: format(endDate, 'MMM yy', { locale: de }),
      change: endTotal - startTotal,
    })
  }

  return result
}

export const ACCOUNT_TYPES = [
  { value: 'bank', label: 'Bankkonto', icon: 'Landmark' },
  { value: 'depot', label: 'Depot', icon: 'LineChart' },
  { value: 'wallet', label: 'Geldbeutel', icon: 'Wallet' },
  { value: 'paypal', label: 'PayPal', icon: 'CreditCard' },
  { value: 'crypto', label: 'Krypto', icon: 'Coins' },
  { value: 'savings', label: 'Sparkonto', icon: 'PiggyBank' },
  { value: 'cash', label: 'Bargeld', icon: 'Banknote' },
  { value: 'other', label: 'Sonstiges', icon: 'HelpCircle' },
]

export const ACCOUNT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6', '#a855f7', '#84cc16',
]

export function getAccountTypeLabel(type: string): string {
  return ACCOUNT_TYPES.find((t) => t.value === type)?.label ?? type
}

export function getAccountTypeIconName(type: string): string {
  return ACCOUNT_TYPES.find((t) => t.value === type)?.icon ?? 'CircleHelp'
}
