import { useState } from 'react'
import { Modal } from '../UI/Modal'
import { Button } from '../UI/Button'
import { AlertTriangle } from 'lucide-react'
import type { Account } from '../../types/finance'

interface Props {
  open: boolean
  onClose: () => void
  account: Account
  onClose_: (id: string) => Promise<void>
}

export function CloseAccountModal({ open, onClose, account, onClose_: onCloseAccount }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleClose() {
    setLoading(true)
    try {
      await onCloseAccount(account.id)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Konto schließen" size="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-gray-300">
            <strong className="text-white">{account.name}</strong> wird als geschlossen markiert.
            Die historischen Daten bleiben erhalten und erscheinen weiterhin in Graphen.
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Abbrechen
          </Button>
          <Button variant="danger" loading={loading} onClick={handleClose} className="flex-1">
            Schließen
          </Button>
        </div>
      </div>
    </Modal>
  )
}
