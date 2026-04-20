import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { UserSettings } from '../types/settings'

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings>({})
  const [loading, setLoading] = useState(true)

  const fetchSettings = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data } = await supabase
      .from('ft_user_settings')
      .select('settings')
      .eq('user_id', user.id)
      .single()

    if (data?.settings) setSettings(data.settings as UserSettings)
    setLoading(false)
  }, [])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  const updateSettings = useCallback(async (patch: Partial<UserSettings>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const merged = { ...settings, ...patch }
    setSettings(merged)

    await supabase
      .from('ft_user_settings')
      .upsert(
        { user_id: user.id, settings: merged, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' },
      )
  }, [settings])

  const resetSettings = useCallback(async (key: keyof UserSettings) => {
    const next = { ...settings }
    delete next[key]
    setSettings(next)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase
      .from('ft_user_settings')
      .upsert(
        { user_id: user.id, settings: next, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' },
      )
  }, [settings])

  return { settings, loading, updateSettings, resetSettings }
}
