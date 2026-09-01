export interface NavItem {
  label: string
  icon: string
  to: string
  active?: boolean
}

export interface ServiceItem {
  id: string
  title: string
  category: string
  status: 'pending' | 'in-progress' | 'completed'
  date: string
  description: string
}

export interface BuildingUnit {
  id: string
  number: string
  floor: string
  residentName: string
  status: 'occupied' | 'vacant' | 'maintenance'
}

export interface NotificationItem {
  id: string
  title: string
  message: string
  time: string
  unread: boolean
}
