import { useState } from 'react'
import { Modal } from '../UI/Modal'
import { Button } from '../UI/Button'
import { TypeIcon } from '../UI/TypeIcon'
import { ACCOUNT_TYPES, ACCOUNT_COLORS } from '../../lib/utils'
import type { Account } from '../../types/finance'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: { name: string; type: string; icon?: string; color?: string }) => Promise<unknown>
  initial?: Partial<Account>
  title?: string
}

export function AccountForm({ open, onClose, onSave, initial, title = 'Konto anlegen' }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [type, setType] = useState(initial?.type ?? 'bank')
  const [color, setColor] = useState(initial?.color ?? ACCOUNT_COLORS[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedType = ACCOUNT_TYPES.find((t) => t.value === type)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError(null)
    try {
      await onSave({
        name: name.trim(),
        type,
        icon: selectedType?.icon,
        color,
      })
      setName('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z.B. DKB Girokonto, Consorsbank Depot..."
            required
            autoFocus
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-accent-500/60 focus:ring-1 focus:ring-accent-500/30 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Typ</label>
          <div className="grid grid-cols-4 gap-2">
            {ACCOUNT_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-[10px] font-bold transition-all ${
                  type === t.value
                    ? 'border-accent-500 bg-accent-500/20 text-accent-300'
                    : 'border-white/10 bg-white/5 text-gray-500 hover:border-white/20'
                }`}
              >
                <TypeIcon name={t.icon} size={18} />
                <span className="leading-tight text-center uppercase tracking-tighter">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Farbe (für Charts)</label>
          <div className="flex gap-2 flex-wrap">
            {ACCOUNT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full transition-all ${
                  color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-110' : 'hover:scale-110'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

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
