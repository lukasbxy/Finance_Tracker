import { 
  Landmark, 
  LineChart, 
  Wallet, 
  CreditCard, 
  Coins, 
  PiggyBank, 
  Banknote, 
  HelpCircle,
  CircleHelp,
  type LucideProps 
} from 'lucide-react'
import { getAccountTypeIconName } from '../../lib/utils'

const ICON_MAP: Record<string, any> = {
  Landmark,
  LineChart,
  Wallet,
  CreditCard,
  Coins,
  PiggyBank,
  Banknote,
  HelpCircle,
  CircleHelp
}

interface Props extends LucideProps {
  type?: string
  name?: string
}

export function TypeIcon({ type, name, ...props }: Props) {
  const iconName = name || (type ? getAccountTypeIconName(type) : 'CircleHelp')
  const IconComponent = ICON_MAP[iconName] || CircleHelp
  return <IconComponent {...props} />
}
