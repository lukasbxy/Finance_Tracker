import React from 'react'
import * as Icons from 'lucide-react'
import { LucideProps } from 'lucide-react'
import { getAccountTypeIconName } from '../../lib/utils'

interface Props extends LucideProps {
  type?: string
  name?: string
}

export function TypeIcon({ type, name, ...props }: Props) {
  const iconName = name || (type ? getAccountTypeIconName(type) : 'CircleHelp')
  const IconComponent = (Icons as any)[iconName] || Icons.CircleHelp

  return <IconComponent {...props} />
}
