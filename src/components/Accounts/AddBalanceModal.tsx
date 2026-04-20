import { useState } from 'react'
import { Modal } from '../UI/Modal'
import { Button } from '../UI/Button'
import { todayISOString } from '../../lib/utils'
import type { Account } from '../../types/finance'

interface Props {
  open: boolean
  onClose: () => void
  account: Account
  onAdd: (input: { account_id: string; amount: number; recorded_at: string; note?: string }) => Promise<unknown>
}

export function AddBalanceModal({ open, onClose, account, onAdd }: Props) {
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(todayISOString())
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = parseFloat(amount.replace(',', '.'))
    if (isNaN(parsed)) {
      setError('Bitte gib einen gültigen Betrag ein.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await onAdd({
        account_id: account.id,
        amount: parsed,
        recorded_at: new Date(date + 'T12:00:00').toISOString(),
        note: note.trim() || undefined,
      })
      setAmount('')
      setNote('')
      setDate(todayISOString())
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Kontostand: ${account.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Betrag (€)</label>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0,00"
            required
            autoFocus
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-2xl font-semibold placeholder:text-gray-700 focus:outline-none focus:border-accent-500/60 focus:ring-1 focus:ring-accent-500/30 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Datum</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent-500/60 focus:ring-1 focus:ring-accent-500/30 transition-all [color-scheme:dark]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Notiz (optional)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="z.B. nach Gehalt, Dividende..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-accent-500/60 focus:ring-1 focus:ring-accent-500/30 transition-all"
          />
        </div>

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Abbrechen
          </Button>
          <Button type="submit" loading={loading} className="flex-1">
            Speichern
          </Button>
        </div>
      </form>
    </Modal>
  )
}
