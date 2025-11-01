'use client';

import { useState } from 'react';
import { Expense, GroupMember, ExpenseShare } from '@/types/budget';
import { calculateGroupBalances, formatCurrency, calculateSettlements } from '@/utils/budget';
import { Trip } from '@/types/itinerary';

interface TripBudgetViewProps {
  trip: Trip;
  onUpdateTrip: (updatedTrip: Trip) => void;
  currentUserId: string;
  currentUserEmail: string;
}

export default function TripBudgetView({ 
  trip, 
  onUpdateTrip,
  currentUserId,
  currentUserEmail 
}: TripBudgetViewProps) {
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  // Initialize budget data from trip if not exists
  const expenses: Expense[] = (trip as any).expenses || [];
  const members: GroupMember[] = (trip as any).budgetMembers || [
    {
      id: currentUserId,
      name: currentUserEmail.split('@')[0],
      email: currentUserEmail,
      role: 'owner' as const,
      joinedAt: new Date().toISOString(),
    }
  ];

  const currency = (trip as any).currency || 'USD';

  // Create a mock expense group for calculations
  const expenseGroup = {
    id: trip.id,
    name: trip.title,
    currency,
    members,
    expenses,
    defaultSplitType: 'equal' as const,
    createdBy: currentUserId,
    createdAt: trip.createdAt || new Date().toISOString(),
    updatedAt: trip.updatedAt || new Date().toISOString(),
  };

  const balances = calculateGroupBalances(expenseGroup);
  const settlements = calculateSettlements(balances);
  const myBalance = balances.find(b => b.memberId === currentUserId);
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.totalAmount, 0);

  return (
    <div className="h-screen bg-static-bg-50 dark:bg-static-bg-900 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-static-text-900 dark:text-static-text-50 mb-2">
            Trip Budget
          </h1>
          <p className="text-static-text-600 dark:text-static-text-400">
            Track and split expenses for {trip.title}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Total Expenses */}
          <div className="bg-white dark:bg-static-bg-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-static-text-600 dark:text-static-text-400">
                Total Expenses
              </span>
            </div>
            <p className="text-2xl font-bold text-static-text-900 dark:text-static-text-50">
              {formatCurrency(totalExpenses, currency)}
            </p>
          </div>

          {/* Your Balance */}
          <div className="bg-white dark:bg-static-bg-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                myBalance && myBalance.netBalance > 0 
                  ? 'bg-green-100 dark:bg-green-900'
                  : myBalance && myBalance.netBalance < 0
                  ? 'bg-red-100 dark:bg-red-900'
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                <svg className={`w-5 h-5 ${
                  myBalance && myBalance.netBalance > 0 
                    ? 'text-green-600 dark:text-green-400'
                    : myBalance && myBalance.netBalance < 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-static-text-600 dark:text-static-text-400">
                Your Balance
              </span>
            </div>
            <p className={`text-2xl font-bold ${
              myBalance && myBalance.netBalance > 0
                ? 'text-green-600 dark:text-green-400'
                : myBalance && myBalance.netBalance < 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-static-text-900 dark:text-static-text-50'
            }`}>
              {myBalance && myBalance.netBalance > 0 && '+'}
              {formatCurrency(myBalance?.netBalance || 0, currency)}
            </p>
          </div>

          {/* Group Members */}
          <div className="bg-white dark:bg-static-bg-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-static-text-600 dark:text-static-text-400">
                Group Members
              </span>
            </div>
            <p className="text-2xl font-bold text-static-text-900 dark:text-static-text-50">
              {members.length}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Expenses List */}
          <div className="bg-white dark:bg-static-bg-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-static-text-900 dark:text-static-text-50">
                Expenses
              </h2>
              <button
                onClick={() => setShowAddExpenseModal(true)}
                className="px-4 py-2 bg-static-accent-600 hover:bg-static-accent-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Expense
              </button>
            </div>

            {expenses.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-static-text-400 dark:text-static-text-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-static-text-600 dark:text-static-text-400 mb-4">
                  No expenses yet
                </p>
                <button
                  onClick={() => setShowAddExpenseModal(true)}
                  className="text-static-accent-600 dark:text-static-accent-400 hover:underline font-medium"
                >
                  Add your first expense
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {expenses.map((expense) => {
                  const payer = members.find(m => m.id === expense.paidBy);
                  return (
                    <div
                      key={expense.id}
                      className="p-4 bg-static-bg-50 dark:bg-static-bg-900 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-static-text-900 dark:text-static-text-50">
                          {expense.description}
                        </h3>
                        <span className="text-lg font-bold text-static-text-900 dark:text-static-text-50">
                          {formatCurrency(expense.totalAmount, currency)}
                        </span>
                      </div>
                      <p className="text-sm text-static-text-600 dark:text-static-text-400">
                        Paid by <span className="font-medium">{payer?.name || 'Unknown'}</span>
                      </p>
                      <p className="text-xs text-static-text-500 dark:text-static-text-500 mt-1">
                        {new Date(expense.date).toLocaleDateString()} • Split: {expense.splitType}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Balances & Settlements */}
          <div className="space-y-6">
            {/* Member Balances */}
            <div className="bg-white dark:bg-static-bg-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-static-text-900 dark:text-static-text-50">
                  Member Balances
                </h2>
                <button
                  onClick={() => setShowAddMemberModal(true)}
                  className="text-sm text-static-accent-600 dark:text-static-accent-400 hover:underline font-medium"
                >
                  Add Member
                </button>
              </div>

              <div className="space-y-3">
                {balances.map((balance) => (
                  <div
                    key={balance.memberId}
                    className="flex items-center justify-between p-3 bg-static-bg-50 dark:bg-static-bg-900 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {balance.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-static-text-900 dark:text-static-text-50">
                          {balance.name}
                        </p>
                        <p className="text-xs text-static-text-600 dark:text-static-text-400">
                          Paid: {formatCurrency(balance.totalPaid, currency)} • 
                          Owes: {formatCurrency(balance.totalOwed, currency)}
                        </p>
                      </div>
                    </div>
                    <span className={`font-bold ${
                      balance.netBalance > 0
                        ? 'text-green-600 dark:text-green-400'
                        : balance.netBalance < 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-static-text-600 dark:text-static-text-400'
                    }`}>
                      {balance.netBalance > 0 && '+'}
                      {formatCurrency(balance.netBalance, currency)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggested Settlements */}
            {settlements.length > 0 && (
              <div className="bg-white dark:bg-static-bg-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-static-text-900 dark:text-static-text-50 mb-4">
                  Suggested Settlements
                </h2>
                <p className="text-sm text-static-text-600 dark:text-static-text-400 mb-4">
                  Settle all debts with {settlements.length} payment{settlements.length > 1 ? 's' : ''}:
                </p>
                <div className="space-y-3">
                  {settlements.map((settlement, idx) => {
                    const fromMember = members.find(m => m.id === settlement.from);
                    const toMember = members.find(m => m.id === settlement.to);
                    return (
                      <div
                        key={idx}
                        className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                      >
                        <p className="text-sm text-static-text-900 dark:text-static-text-50">
                          <span className="font-semibold">{fromMember?.name}</span>
                          {' pays '}
                          <span className="font-semibold">{toMember?.name}</span>
                        </p>
                        <p className="text-lg font-bold text-green-600 dark:text-green-400 mt-1">
                          {formatCurrency(settlement.amount, currency)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Expense Modal - Placeholder */}
      {showAddExpenseModal && (
        <div 
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40"
          onClick={() => setShowAddExpenseModal(false)}
        >
          <div 
            className="bg-white dark:bg-static-bg-800 rounded-2xl shadow-xl p-8 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-static-text-900 dark:text-static-text-50 mb-4">
              Add Expense
            </h2>
            <p className="text-static-text-600 dark:text-static-text-400 mb-6">
              Expense modal coming soon...
            </p>
            <button
              onClick={() => setShowAddExpenseModal(false)}
              className="w-full px-4 py-2 bg-static-accent-600 hover:bg-static-accent-700 text-white rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Add Member Modal - Placeholder */}
      {showAddMemberModal && (
        <div 
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40"
          onClick={() => setShowAddMemberModal(false)}
        >
          <div 
            className="bg-white dark:bg-static-bg-800 rounded-2xl shadow-xl p-8 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-static-text-900 dark:text-static-text-50 mb-4">
              Add Member
            </h2>
            <p className="text-static-text-600 dark:text-static-text-400 mb-6">
              Member invitation modal coming soon...
            </p>
            <button
              onClick={() => setShowAddMemberModal(false)}
              className="w-full px-4 py-2 bg-static-accent-600 hover:bg-static-accent-700 text-white rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
