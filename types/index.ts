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
  buildingId: string
  number: string
  floor: string
  status: 'occupied' | 'vacant' | 'maintenance'
  residentName?: string
  residentId?: string
}

export interface NotificationItem {
  id: string
  title: string
  message: string
  time: string
  unread: boolean
}

export interface User {
  id: string
  name: string
  email: string
  role: 'manager' | 'resident'
  avatarInitials?: string
  createdAt: string
}

export interface Building {
  id: string
  name: string
  address: string
  description?: string
  unitCount: number
  residentCount: number
  managerId: string
  invitationCode: string
  invitationLink: string
  createdAt: string
}

export interface BuildingMember {
  id: string
  buildingId: string
  userId: string
  user?: User
  unitId?: string
  role: 'manager' | 'resident'
  joinedAt: string
  invitedBy?: string
}

export interface Invitation {
  id: string
  buildingId: string
  code: string
  link: string
  createdBy: string
  used: boolean
  usedBy?: string
  usedAt?: string
  createdAt: string
}

export interface Announcement {
  id: string
  buildingId: string
  title: string
  description: string
  importance: 'normal' | 'important'
  imageUrl?: string
  createdBy: string
  createdAt: string
}

export interface ProblemReport {
  id: string
  buildingId: string
  category: 'water' | 'electricity' | 'elevator' | 'gas' | 'common' | 'cleaning' | 'other'
  title: string
  description: string
  imageUrl?: string
  status: 'new' | 'in-progress' | 'resolved'
  createdBy: string
  createdAt: string
  updatedAt?: string
  assignedTo?: string
}

export interface Charge {
  id: string
  buildingId: string
  title: string
  amount: number
  period: string
  dueDate: string
  description?: string
  status: 'unpaid' | 'paid' | 'late'
  paidAt?: string
  paidBy?: string
  note?: string
  createdAt: string
  createdBy: string
}

export interface Expense {
  id: string
  buildingId: string
  title: string
  amount: number
  category: 'water' | 'gas' | 'electricity' | 'elevator' | 'cleaning' | 'repair' | 'other'
  date: string
  description?: string
  receiptUrl?: string
  createdAt: string
  createdBy: string
}
