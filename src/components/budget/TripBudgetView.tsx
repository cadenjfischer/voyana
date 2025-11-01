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

type BudgetTab = 'expenses' | 'balance' | 'settlements';

export default function TripBudgetView({ 
  trip, 
  onUpdateTrip,
  currentUserId,
  currentUserEmail 
}: TripBudgetViewProps) {
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'expenses' | 'balance' | 'settlements'>('expenses');
  
  // Add member form state
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');

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

  // Handle add member
  const handleAddMember = () => {
    if (!newMemberName.trim()) return;
    
    const newMember: GroupMember = {
      id: `member-${Date.now()}`,
      name: newMemberName.trim(),
      ...(newMemberEmail.trim() && { email: newMemberEmail.trim() }),
      joinedAt: new Date().toISOString(),
    };

    const updatedMembers = [...members, newMember];
    
    // Update trip with new member
    const updatedTrip = {
      ...trip,
      budgetMembers: updatedMembers,
    } as any;
    
    onUpdateTrip(updatedTrip);

    // Reset form and close modal
    setNewMemberName('');
    setNewMemberEmail('');
    setShowAddMemberModal(false);
  };

  // Handle remove member
  const handleRemoveMember = (memberId: string) => {
    if (memberId === currentUserId) {
      alert("You can't remove yourself from the group");
      return;
    }

    const updatedMembers = members.filter(m => m.id !== memberId);
    
    const updatedTrip = {
      ...trip,
      budgetMembers: updatedMembers,
    } as any;
    
    onUpdateTrip(updatedTrip);
  };

  // Handle set budget goal
  const handleSetBudgetGoal = () => {
    const goal = parseFloat(budgetGoalInput);
    if (isNaN(goal) || goal < 0) return;
    
    const updatedTrip = {
      ...trip,
      budgetGoal: goal,
    } as any;
    
    onUpdateTrip(updatedTrip);
    setShowBudgetGoalModal(false);
  };

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

  // Budget goal tracking
  const budgetGoal = (trip as any).budgetGoal || 0;
  const budgetUsedPercentage = budgetGoal > 0 ? (totalExpenses / budgetGoal) * 100 : 0;

  // Calculate spending per person
  const spendingByPerson = balances.map(b => ({
    name: b.name,
    amount: b.totalPaid,
    percentage: totalExpenses > 0 ? (b.totalPaid / totalExpenses) * 100 : 0,
  })).sort((a, b) => b.amount - a.amount);

  // Category breakdown with actual data
  const categoryData = expenses.reduce((acc, expense) => {
    const cat = expense.category || 'Other';
    if (!acc[cat]) {
      acc[cat] = { total: 0, count: 0, expenses: [] };
    }
    acc[cat].total += expense.totalAmount;
    acc[cat].count += 1;
    acc[cat].expenses.push(expense);
    return acc;
  }, {} as Record<string, { total: number; count: number; expenses: Expense[] }>);

  const getCategoryIcon = (name: string) => {
    const icons: Record<string, string> = {
      'Sleep': '�️',
      'Transport': '🚗',
      'See & Do': '📸',
      'Eat & Drink': '🍽️',
      'Food': '🍽️',
      'Lodging': '🛏️',
      'Activities': '📸',
      'Shopping': '🛍️',
      'Other': '⋯',
    };
    return icons[name] || '💰';
  };

  const categories = Object.entries(categoryData)
    .map(([name, data]) => ({
      name,
      icon: getCategoryIcon(name),
      total: data.total,
      count: data.count,
      percentage: totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0,
      expenses: data.expenses,
    }))
    .sort((a, b) => b.total - a.total);

  // Calculate trip insights
  const tripDays = trip.endDate && trip.startDate
    ? Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24))
    : 1;
  const dailyAverage = totalExpenses / Math.max(tripDays, 1);
  const biggestCategory = categories[0];
  
  // Expanded category state
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showBudgetGoalModal, setShowBudgetGoalModal] = useState(false);
  const [budgetGoalInput, setBudgetGoalInput] = useState(budgetGoal.toString());

  // Calculate percentages for progress ring
  const totalPaid = totalExpenses;
  const totalPending = 0; // For now, all expenses are paid

  return (
    <div className="h-screen bg-static-bg-50 dark:bg-static-bg-900 flex">
      {/* Left Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-static-text-900 dark:text-static-text-50 mb-1">
            Budget
          </h1>
          <div className="flex items-center gap-2 text-sm text-static-text-600 dark:text-static-text-400">
            <select className="bg-transparent border-none text-sm font-medium focus:outline-none cursor-pointer">
              <option>{currency}</option>
            </select>
            <span>•</span>
            <span>{new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 p-4">
          <button
            onClick={() => setActiveTab('expenses')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
              activeTab === 'expenses'
                ? 'tab-strip-gradient text-white'
                : 'text-static-text-600 dark:text-static-text-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="font-medium">Expenses</span>
          </button>

          <button
            onClick={() => setActiveTab('balance')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
              activeTab === 'balance'
                ? 'bg-static-bg-700 dark:bg-static-bg-700 text-white'
                : 'text-static-text-600 dark:text-static-text-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
            <span className="font-medium">Balance</span>
          </button>

          <button
            onClick={() => setActiveTab('settlements')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'settlements'
                ? 'bg-static-bg-700 dark:bg-static-bg-700 text-white'
                : 'text-static-text-600 dark:text-static-text-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span className="font-medium">Settlements</span>
          </button>
        </nav>

        {/* Add Expense Button */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowAddExpenseModal(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-static-bg-700 dark:bg-static-bg-700 hover:bg-static-bg-600 dark:hover:bg-static-bg-600 text-white rounded-lg font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add expense
          </button>
        </div>

        {/* Invite Friends */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="bg-static-bg-100 dark:bg-static-bg-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="font-semibold text-static-text-900 dark:text-static-text-50 mb-1">
              Manage your budget together
            </h3>
            <p className="text-sm text-static-text-600 dark:text-static-text-400 mb-3">
              Invite your friends to budget your trip together!
            </p>
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="flex items-center gap-2 text-static-text-700 dark:text-static-text-300 font-medium text-sm hover:underline"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Invite friends
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Expenses Tab */}
        {activeTab === 'expenses' && (
          <div className="p-8">
            {/* Expense List */}
            <div className="max-w-4xl">
              {expenses.length === 0 ? (
                <div className="text-center py-20">
                  <svg className="w-20 h-20 text-static-text-400 dark:text-static-text-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h3 className="text-xl font-semibold text-static-text-900 dark:text-static-text-50 mb-2">
                    No expenses yet
                  </h3>
                  <p className="text-static-text-600 dark:text-static-text-400 mb-6">
                    Start tracking your trip expenses
                  </p>
                  <button
                    onClick={() => setShowAddExpenseModal(true)}
                    className="px-6 py-3 bg-static-bg-700 dark:bg-static-bg-700 hover:bg-static-bg-600 dark:hover:bg-static-bg-600 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add your first expense
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {expenses.map((expense) => {
                    const payer = members.find(m => m.id === expense.paidBy);
                    return (
                      <div
                        key={expense.id}
                        className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start gap-4">
                          {/* Expense Icon/Avatar */}
                          <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                            {expense.receiptPhoto ? (
                              <img src={expense.receiptPhoto} alt="" className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                            )}
                          </div>

                          {/* Expense Details */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-static-text-900 dark:text-static-text-50 mb-1">
                              {expense.description}
                            </h3>
                            <p className="text-sm text-static-text-600 dark:text-static-text-400">
                              by <span className="font-medium">{payer?.name || 'Unknown'}</span>
                            </p>
                            <p className="text-xs text-static-text-500 dark:text-static-text-500 mt-1">
                              {expense.category || 'Other'}
                            </p>
                          </div>

                          {/* Amount */}
                          <div className="text-right flex-shrink-0">
                            <p className="text-xl font-bold text-static-text-900 dark:text-static-text-50">
                              {formatCurrency(expense.totalAmount, currency)}
                            </p>
                            <p className="text-xs text-static-text-500 dark:text-static-text-500 mt-1">
                              {formatCurrency(0, currency)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Balance Tab */}
        {activeTab === 'balance' && (
          <div className="p-8">
            <div className="max-w-4xl">
              <h2 className="text-2xl font-bold text-static-text-900 dark:text-static-text-50 mb-6">
                Member Balances
              </h2>

              <div className="space-y-4">
                {balances.map((balance) => (
                  <div
                    key={balance.memberId}
                    className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                          {balance.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-static-text-900 dark:text-static-text-50">
                            {balance.name}
                          </h3>
                          <p className="text-sm text-static-text-600 dark:text-static-text-400">
                            Paid {formatCurrency(balance.totalPaid, currency)} • 
                            Owes {formatCurrency(balance.totalOwed, currency)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${
                          balance.netBalance > 0
                            ? 'text-green-600 dark:text-green-400'
                            : balance.netBalance < 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-static-text-600 dark:text-static-text-400'
                        }`}>
                          {balance.netBalance > 0 && '+'}
                          {formatCurrency(balance.netBalance, currency)}
                        </p>
                        <p className="text-sm text-static-text-600 dark:text-static-text-400">
                          {balance.netBalance > 0 ? 'gets back' : balance.netBalance < 0 ? 'owes' : 'settled'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Settlements Tab */}
        {activeTab === 'settlements' && (
          <div className="p-8">
            <div className="max-w-4xl">
              <h2 className="text-2xl font-bold text-static-text-900 dark:text-static-text-50 mb-2">
                Suggested Settlements
              </h2>
              <p className="text-static-text-600 dark:text-static-text-400 mb-6">
                {settlements.length > 0 
                  ? `Settle all debts with ${settlements.length} payment${settlements.length > 1 ? 's' : ''}`
                  : 'All balances are settled!'}
              </p>

              {settlements.length === 0 ? (
                <div className="text-center py-20">
                  <svg className="w-20 h-20 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-xl font-semibold text-static-text-900 dark:text-static-text-50 mb-2">
                    All Settled Up!
                  </h3>
                  <p className="text-static-text-600 dark:text-static-text-400">
                    Everyone has paid their share
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {settlements.map((settlement, idx) => {
                    const fromMember = members.find(m => m.id === settlement.from);
                    const toMember = members.find(m => m.id === settlement.to);
                    return (
                      <div
                        key={idx}
                        className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {/* From Avatar */}
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-400 to-pink-600 flex items-center justify-center text-white font-bold">
                              {fromMember?.name.charAt(0).toUpperCase()}
                            </div>
                            
                            {/* Arrow */}
                            <svg className="w-8 h-8 text-static-text-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                            
                            {/* To Avatar */}
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-teal-600 flex items-center justify-center text-white font-bold">
                              {toMember?.name.charAt(0).toUpperCase()}
                            </div>

                            {/* Names */}
                            <div>
                              <p className="text-static-text-900 dark:text-static-text-50">
                                <span className="font-semibold">{fromMember?.name}</span>
                                {' pays '}
                                <span className="font-semibold">{toMember?.name}</span>
                              </p>
                            </div>
                          </div>

                          {/* Amount */}
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                              {formatCurrency(settlement.amount, currency)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right Sidebar - Total Trip Cost & Categories */}
        <div className="fixed right-8 top-24 w-80">
          {/* Budget Goal Progress */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-static-text-900 dark:text-static-text-50">
                {budgetGoal > 0 ? 'Budget Goal' : 'Trip Spending'}
              </h3>
              <button
                onClick={() => {
                  setBudgetGoalInput(budgetGoal > 0 ? budgetGoal.toString() : '');
                  setShowBudgetGoalModal(true);
                }}
                className="text-xs text-static-text-700 dark:text-static-text-300 hover:text-static-text-900 dark:hover:text-static-text-100 font-medium"
              >
                {budgetGoal > 0 ? 'Edit' : 'Set Goal'}
              </button>
            </div>

            <div className="flex flex-col">
              {/* Amount Display */}
              <div className="text-center mb-6">
                <p className="text-5xl font-bold text-static-text-900 dark:text-static-text-50 mb-2">
                  {formatCurrency(totalExpenses, currency)}
                </p>
                {budgetGoal > 0 ? (
                  <p className="text-sm text-static-text-500 dark:text-static-text-500">
                    {budgetUsedPercentage.toFixed(0)}% of {formatCurrency(budgetGoal, currency)} goal
                  </p>
                ) : (
                  <p className="text-sm text-static-text-500 dark:text-static-text-500">
                    Total spent • No goal set
                  </p>
                )}
              </div>

              {/* Progress Bar */}
              {budgetGoal > 0 && (
                <div className="w-full mb-6">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        budgetUsedPercentage > 100
                          ? 'bg-gradient-to-r from-red-500 to-red-600'
                          : budgetUsedPercentage > 90
                          ? 'bg-gradient-to-r from-red-400 to-red-500'
                          : budgetUsedPercentage > 75
                          ? 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                          : 'bg-gradient-to-r from-orange-400 to-orange-600'
                      }`}
                      style={{ width: `${Math.min(budgetUsedPercentage, 100)}%` }}
                    />
                  </div>
                  {budgetUsedPercentage > 100 && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-2 text-center font-medium">
                      ⚠️ Over budget by {formatCurrency(totalExpenses - budgetGoal, currency)}
                    </p>
                  )}
                </div>
              )}

              {/* Budget Status */}
              {budgetGoal > 0 && (
                <div className="w-full space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-static-text-600 dark:text-static-text-400">Spent</span>
                    <span className="text-sm font-semibold text-static-text-900 dark:text-static-text-50">
                      {formatCurrency(totalExpenses, currency)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-static-text-600 dark:text-static-text-400">Remaining</span>
                    <span className={`text-sm font-semibold ${
                      budgetGoal - totalExpenses < 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                      {formatCurrency(budgetGoal - totalExpenses, currency)}
                    </span>
                  </div>
                </div>
              )}

              {/* Smart Insights */}
              <div className="w-full pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                {expenses.length > 0 && (
                  <>
                    <div className="flex items-start gap-2">
                      <span className="text-lg">💡</span>
                      <p className="text-xs text-static-text-600 dark:text-static-text-400">
                        <span className="font-semibold">{formatCurrency(dailyAverage, currency)}/day</span> average spending
                      </p>
                    </div>
                    {biggestCategory && (
                      <div className="flex items-start gap-2">
                        <span className="text-lg">📊</span>
                        <p className="text-xs text-static-text-600 dark:text-static-text-400">
                          <span className="font-semibold">{biggestCategory.name}</span> is {biggestCategory.percentage.toFixed(0)}% of total
                        </p>
                      </div>
                    )}
                    {spendingByPerson.length > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-lg">👥</span>
                        <p className="text-xs text-static-text-600 dark:text-static-text-400">
                          <span className="font-semibold">{spendingByPerson[0].name}</span> paid {spendingByPerson[0].percentage.toFixed(0)}%
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Spending by Person */}
          {spendingByPerson.length > 1 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
              <h3 className="font-semibold text-static-text-900 dark:text-static-text-50 mb-4">
                Who's Paying
              </h3>
              <div className="space-y-3">
                {spendingByPerson.map((person, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-static-text-900 dark:text-static-text-50">
                        {person.name}
                      </span>
                      <span className="text-sm font-semibold text-static-text-900 dark:text-static-text-50">
                        {formatCurrency(person.amount, currency)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-static-bg-600 to-static-bg-700 rounded-full"
                        style={{ width: `${person.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Categories Breakdown - Interactive */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-static-text-900 dark:text-static-text-50 mb-4">
              Categories
            </h3>
            <div className="space-y-3">
              {categories.map((category) => (
                <div key={category.name}>
                  <button
                    onClick={() => setExpandedCategory(expandedCategory === category.name ? null : category.name)}
                    className="w-full flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 -mx-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{category.icon}</span>
                      <div className="text-left">
                        <p className="text-sm font-medium text-static-text-900 dark:text-static-text-50">
                          {category.name}
                        </p>
                        <p className="text-xs text-static-text-500">
                          {category.count} expense{category.count !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-static-text-900 dark:text-static-text-50">
                        {formatCurrency(category.total, currency)}
                      </span>
                      <svg
                        className={`w-4 h-4 text-static-text-400 transition-transform ${
                          expandedCategory === category.name ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Expanded Category Details */}
                  {expandedCategory === category.name && (
                    <div className="mt-2 ml-11 space-y-2 pb-2">
                      {/* Progress bar for percentage */}
                      <div className="mb-3">
                        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-static-bg-700 rounded-full"
                            style={{ width: `${category.percentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-static-text-500 mt-1">
                          {category.percentage.toFixed(1)}% of total spending
                        </p>
                      </div>
                      
                      {/* Individual expenses */}
                      {category.expenses.slice(0, 3).map((expense) => {
                        const payer = members.find(m => m.id === expense.paidBy);
                        return (
                          <div key={expense.id} className="flex items-center justify-between text-xs">
                            <span className="text-static-text-600 dark:text-static-text-400 truncate">
                              {expense.description}
                            </span>
                            <span className="text-static-text-900 dark:text-static-text-50 font-medium ml-2">
                              {formatCurrency(expense.totalAmount, currency)}
                            </span>
                          </div>
                        );
                      })}
                      {category.expenses.length > 3 && (
                        <p className="text-xs text-static-text-500 italic">
                          +{category.expenses.length - 3} more
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
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
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full mx-4"
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
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-static-text-900 dark:text-static-text-50 mb-2">
              Add Member
            </h2>
            <p className="text-static-text-600 dark:text-static-text-400 mb-6">
              Add someone to your trip budget group
            </p>

            <form onSubmit={(e) => { e.preventDefault(); handleAddMember(); }} className="space-y-4">
              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium text-static-text-900 dark:text-static-text-50 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="Enter member's name"
                  className="w-full px-4 py-3 bg-static-bg-100 dark:bg-static-bg-700 border border-gray-300 dark:border-gray-600 rounded-lg text-static-text-900 dark:text-static-text-50 placeholder-static-text-500 focus:outline-none focus:ring-2 focus:ring-static-accent-500"
                  autoFocus
                  required
                />
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-static-text-900 dark:text-static-text-50 mb-2">
                  Email <span className="text-static-text-500 text-xs">(optional)</span>
                </label>
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full px-4 py-3 bg-static-bg-100 dark:bg-static-bg-700 border border-gray-300 dark:border-gray-600 rounded-lg text-static-text-900 dark:text-static-text-50 placeholder-static-text-500 focus:outline-none focus:ring-2 focus:ring-static-accent-500"
                />
              </div>

              {/* Current Members List */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-static-text-900 dark:text-static-text-50 mb-3">
                  Current Members ({members.length})
                </p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between py-2 px-3 bg-static-bg-100 dark:bg-static-bg-700 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-static-text-900 dark:text-static-text-50">
                            {member.name}
                            {member.id === currentUserId && (
                              <span className="ml-2 text-xs text-static-text-500">(You)</span>
                            )}
                          </p>
                          {member.email && (
                            <p className="text-xs text-static-text-600 dark:text-static-text-400">
                              {member.email}
                            </p>
                          )}
                        </div>
                      </div>
                      {member.id !== currentUserId && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-red-500 hover:text-red-600 p-1"
                          title="Remove member"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setNewMemberName('');
                    setNewMemberEmail('');
                    setShowAddMemberModal(false);
                  }}
                  className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-static-text-900 dark:text-static-text-50 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newMemberName.trim()}
                  className="flex-1 px-4 py-3 bg-static-bg-700 dark:bg-static-bg-700 hover:bg-static-bg-600 dark:hover:bg-static-bg-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Budget Goal Modal */}
      {showBudgetGoalModal && (
        <div 
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40"
          onClick={() => setShowBudgetGoalModal(false)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-static-text-900 dark:text-static-text-50 mb-2">
              Set Budget Goal
            </h2>
            <p className="text-static-text-600 dark:text-static-text-400 mb-6">
              Track your spending against a target budget for this trip
            </p>

            <form onSubmit={(e) => { e.preventDefault(); handleSetBudgetGoal(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-static-text-900 dark:text-static-text-50 mb-2">
                  Budget Goal ({currency})
                </label>
                <input
                  type="number"
                  value={budgetGoalInput}
                  onChange={(e) => setBudgetGoalInput(e.target.value)}
                  placeholder="e.g., 5000"
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 bg-static-bg-100 dark:bg-static-bg-700 border border-gray-300 dark:border-gray-600 rounded-lg text-static-text-900 dark:text-static-text-50 placeholder-static-text-500 focus:outline-none focus:ring-2 focus:ring-static-accent-500"
                  autoFocus
                />
                <p className="text-xs text-static-text-500 mt-2">
                  Current spending: {formatCurrency(totalExpenses, currency)}
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBudgetGoalModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-static-text-900 dark:text-static-text-50 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-static-bg-700 dark:bg-static-bg-700 hover:bg-static-bg-600 dark:hover:bg-static-bg-600 text-white rounded-lg font-medium transition-colors"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
