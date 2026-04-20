import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LayoutDashboard, Wallet, LogOut, TrendingUp } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/accounts', icon: Wallet, label: 'Konten' },
]

export function Sidebar() {
  const { signOut } = useAuth()

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-56 glass border-r border-white/5 min-h-screen sticky top-0">
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-accent-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp size={18} className="text-accent-400" />
            </div>
            <span className="font-semibold text-white text-sm">Finance Tracker</span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}>
              {({ isActive }) => (
                <motion.div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-accent-500/20 text-accent-300'
                      : 'text-gray-400 hover:text-white hover:bg-white/8'
                  }`}
                  whileTap={{ scale: 0.97 }}
                >
                  <Icon size={18} />
                  {label}
                </motion.div>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-white/5">
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/8 transition-colors w-full"
          >
            <LogOut size={18} />
            Abmelden
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass border-t border-white/10">
        <div className="flex items-center justify-around px-2 py-2 safe-bottom">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className="flex-1">
              {({ isActive }) => (
                <div
                  className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-colors ${
                    isActive ? 'text-accent-400' : 'text-gray-500'
                  }`}
                >
                  <Icon size={22} />
                  <span className="text-[10px] font-medium">{label}</span>
                </div>
              )}
            </NavLink>
          ))}
          <button
            onClick={signOut}
            className="flex-1 flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl text-gray-500 transition-colors"
          >
            <LogOut size={22} />
            <span className="text-[10px] font-medium">Logout</span>
          </button>
        </div>
      </nav>
    </>
  )
}
