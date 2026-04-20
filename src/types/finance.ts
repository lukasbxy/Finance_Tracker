export interface Account {
  id: string
  user_id: string
  name: string
  type: string
  icon: string | null
  color: string | null
  is_closed: boolean
  closed_at: string | null
  created_at: string
  updated_at: string
}

export interface BalanceEntry {
  id: string
  account_id: string
  user_id: string
  amount: number
  recorded_at: string
  note: string | null
  created_at: string
}

export type AccountType = 'bank' | 'depot' | 'wallet' | 'paypal' | 'crypto' | 'savings' | 'cash' | 'other'
