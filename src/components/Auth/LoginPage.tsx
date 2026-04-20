import { useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Mail, Lock, AlertCircle } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../UI/Button'

export function LoginPage() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signIn(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        className="relative w-full max-w-sm"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <div className="text-center mb-8">
          <motion.div
            className="inline-flex items-center justify-center w-14 h-14 bg-accent-500/20 rounded-2xl mb-4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300, delay: 0.1 }}
          >
            <TrendingUp size={28} className="text-accent-400" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white">Finance Tracker</h1>
          <p className="text-gray-500 text-sm mt-1">Dein persönliches Finanz-Dashboard</p>
        </div>

        <div className="glass rounded-2xl p-6 shadow-2xl shadow-black/50">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">E-Mail</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-accent-500/60 focus:ring-1 focus:ring-accent-500/30 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Passwort</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-accent-500/60 focus:ring-1 focus:ring-accent-500/30 transition-all"
                />
              </div>
            </div>

            {error && (
              <motion.div
                className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <AlertCircle size={15} className="shrink-0" />
                {error}
              </motion.div>
            )}

            <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
              Anmelden
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
