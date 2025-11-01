import { ExpenseGroup, MemberBalance, Settlement, Expense } from '@/types/budget';

/**
 * Calculate net balances for all members in a group
 */
export function calculateGroupBalances(group: ExpenseGroup): MemberBalance[] {
  const balances: Map<string, MemberBalance> = new Map();

  // Initialize balances for all members
  group.members.forEach(member => {
    balances.set(member.id, {
      memberId: member.id,
      name: member.name,
      totalPaid: 0,
      totalOwed: 0,
      netBalance: 0,
      avatar: member.avatar,
    });
  });

  // Calculate from all expenses
  group.expenses.forEach(expense => {
    const payer = balances.get(expense.paidBy);
    if (payer) {
      payer.totalPaid += expense.totalAmount;
    }

    // Add what each person owes
    expense.shares.forEach(share => {
      const member = balances.get(share.memberId);
      if (member) {
        member.totalOwed += share.amount;
      }
    });
  });

  // Calculate net balance for each member
  balances.forEach(balance => {
    balance.netBalance = balance.totalPaid - balance.totalOwed;
  });

  return Array.from(balances.values()).sort((a, b) => b.netBalance - a.netBalance);
}

/**
 * Calculate optimal settlements to minimize transactions
 * Uses a greedy algorithm to settle debts efficiently
 */
export function calculateSettlements(balances: MemberBalance[]): Settlement[] {
  const settlements: Settlement[] = [];
  
  // Separate creditors (positive balance) and debtors (negative balance)
  const creditors = balances.filter(b => b.netBalance > 0).map(b => ({ ...b }));
  const debtors = balances.filter(b => b.netBalance < 0).map(b => ({ ...b }));

  // Sort by absolute balance (largest first)
  creditors.sort((a, b) => b.netBalance - a.netBalance);
  debtors.sort((a, b) => a.netBalance - b.netBalance);

  let i = 0;
  let j = 0;

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];

    // Amount to settle is the minimum of what creditor is owed and what debtor owes
    const amount = Math.min(creditor.netBalance, Math.abs(debtor.netBalance));

    if (amount > 0.01) { // Ignore very small amounts
      settlements.push({
        from: debtor.memberId,
        to: creditor.memberId,
        amount: parseFloat(amount.toFixed(2)),
      });

      creditor.netBalance -= amount;
      debtor.netBalance += amount;
    }

    // Move to next creditor or debtor
    if (Math.abs(creditor.netBalance) < 0.01) i++;
    if (Math.abs(debtor.netBalance) < 0.01) j++;
  }

  return settlements;
}

/**
 * Split amount equally among participants
 */
export function splitEqually(amount: number, participantIds: string[]) {
  const share = amount / participantIds.length;
  return participantIds.map(id => ({
    memberId: id,
    amount: parseFloat(share.toFixed(2)),
  }));
}

/**
 * Split amount by custom amounts (must total to amount)
 */
export function splitCustom(amount: number, customShares: { memberId: string; amount: number }[]) {
  const total = customShares.reduce((sum, share) => sum + share.amount, 0);
  
  if (Math.abs(total - amount) > 0.01) {
    throw new Error(`Custom shares (${total}) must equal total amount (${amount})`);
  }
  
  return customShares.map(share => ({
    memberId: share.memberId,
    amount: parseFloat(share.amount.toFixed(2)),
  }));
}

/**
 * Split amount by percentages (must total to 100%)
 */
export function splitByPercentage(
  amount: number,
  percentageShares: { memberId: string; percentage: number }[]
) {
  const totalPercentage = percentageShares.reduce((sum, share) => sum + share.percentage, 0);
  
  if (Math.abs(totalPercentage - 100) > 0.01) {
    throw new Error(`Percentages must total 100% (current: ${totalPercentage}%)`);
  }
  
  return percentageShares.map(share => ({
    memberId: share.memberId,
    amount: parseFloat(((amount * share.percentage) / 100).toFixed(2)),
    percentage: share.percentage,
  }));
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Get member name by ID
 */
export function getMemberName(group: ExpenseGroup, memberId: string): string {
  return group.members.find(m => m.id === memberId)?.name || 'Unknown';
}
