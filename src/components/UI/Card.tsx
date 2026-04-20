import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  animate?: boolean
}

export function Card({ children, className = '', onClick, animate = true }: CardProps) {
  const base = 'glass rounded-2xl p-4 md:p-5'
  const clickable = onClick ? 'cursor-pointer glass-hover' : ''

  if (!animate) {
    return (
      <div className={`${base} ${clickable} ${className}`} onClick={onClick}>
        {children}
      </div>
    )
  }

  return (
    <motion.div
      className={`${base} ${clickable} ${className}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      onClick={onClick}
      whileHover={onClick ? { scale: 1.01 } : undefined}
    >
      {children}
    </motion.div>
  )
}
