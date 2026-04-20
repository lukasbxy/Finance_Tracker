import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Account } from '../types/finance'

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAccounts = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('ft_accounts')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      setError(error.message)
    } else {
      setAccounts(data ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  async function createAccount(input: {
    name: string
    type: string
    icon?: string
    color?: string
  }) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('ft_accounts')
      .insert({ ...input, user_id: user.id })
      .select()
      .single()

    if (error) throw error
    setAccounts((prev) => [...prev, data])
    return data as Account
  }

  async function updateAccount(id: string, input: Partial<Pick<Account, 'name' | 'type' | 'icon' | 'color'>>) {
    const { data, error } = await supabase
      .from('ft_accounts')
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    setAccounts((prev) => prev.map((a) => (a.id === id ? (data as Account) : a)))
    return data as Account
  }

  async function closeAccount(id: string) {
    const { data, error } = await supabase
      .from('ft_accounts')
      .update({ is_closed: true, closed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    setAccounts((prev) => prev.map((a) => (a.id === id ? (data as Account) : a)))
  }

  async function reopenAccount(id: string) {
    const { data, error } = await supabase
      .from('ft_accounts')
      .update({ is_closed: false, closed_at: null, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    setAccounts((prev) => prev.map((a) => (a.id === id ? (data as Account) : a)))
  }

  async function deleteAccount(id: string) {
    const { error } = await supabase.from('ft_accounts').delete().eq('id', id)
    if (error) throw error
    setAccounts((prev) => prev.filter((a) => a.id !== id))
  }

  return {
    accounts,
    loading,
    error,
    refetch: fetchAccounts,
    createAccount,
    updateAccount,
    closeAccount,
    reopenAccount,
    deleteAccount,
  }
}
