import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { BalanceEntry } from '../types/finance'

export function useBalanceEntries(accountId?: string) {
  const [entries, setEntries] = useState<BalanceEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    setError(null)

    let query = supabase
      .from('ft_balance_entries')
      .select('*')
      .order('recorded_at', { ascending: false })

    if (accountId) {
      query = query.eq('account_id', accountId)
    }

    const { data, error } = await query

    if (error) {
      setError(error.message)
    } else {
      setEntries(data ?? [])
    }
    setLoading(false)
  }, [accountId])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  async function addEntry(input: {
    account_id: string
    amount: number
    recorded_at: string
    note?: string
  }) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('ft_balance_entries')
      .insert({ ...input, user_id: user.id })
      .select()
      .single()

    if (error) throw error
    const newEntry = data as BalanceEntry

    setEntries((prev) => {
      if (accountId && newEntry.account_id !== accountId) return prev
      return [newEntry, ...prev].sort(
        (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime(),
      )
    })
    return newEntry
  }

  async function deleteEntry(id: string) {
    const { error } = await supabase.from('ft_balance_entries').delete().eq('id', id)
    if (error) throw error
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  return { entries, loading, error, refetch: fetchEntries, addEntry, deleteEntry }
}
