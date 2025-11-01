// Budget and expense tracking types

export interface GroupMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  avatar?: string;
}

export interface ExpenseShare {
  memberId: string;
  amount: number;
  percentage?: number;
}

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  totalAmount: number;
  paidBy: string; // member ID who paid
  splitType: 'equal' | 'custom' | 'percentage' | 'itemized';
  shares: ExpenseShare[]; // who owes what
  participants: string[]; // member IDs included in this expense
  receiptPhoto?: string;
  category?: string;
  date: string;
  createdBy: string;
  createdAt: string;
}

export interface MemberBalance {
  memberId: string;
  name: string;
  totalPaid: number;
  totalOwed: number;
  netBalance: number; // positive = owed to them, negative = they owe
  avatar?: string;
}

export interface ExpenseGroup {
  id: string;
  name: string;
  description?: string;
  icon?: string; // emoji or photo URL
  currency: string;
  defaultSplitType: 'equal' | 'custom' | 'percentage' | 'itemized';
  members: GroupMember[];
  expenses: Expense[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Settlement {
  from: string; // member ID
  to: string; // member ID
  amount: number;
}
