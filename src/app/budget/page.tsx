'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Header from '@/components/Header';
import StarryBackground from '@/components/StarryBackground';
import CreateGroupModal from '@/components/budget/CreateGroupModal';
import { ExpenseGroup } from '@/types/budget';
import { calculateGroupBalances, formatCurrency } from '@/utils/budget';
import type { User } from '@supabase/supabase-js';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function BudgetPage() {
  const [user, setUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<ExpenseGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);

  // Get user on mount
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });
  }, []);

  // Load groups from localStorage for now (can be moved to Supabase later)
  useEffect(() => {
    if (user) {
      const savedGroups = localStorage.getItem('expense-groups');
      if (savedGroups) {
        setGroups(JSON.parse(savedGroups));
      }
    }
  }, [user]);

  const saveGroups = (updatedGroups: ExpenseGroup[]) => {
    setGroups(updatedGroups);
    localStorage.setItem('expense-groups', JSON.stringify(updatedGroups));
  };

  const handleCreateGroup = (newGroup: ExpenseGroup) => {
    saveGroups([...groups, newGroup]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-static-bg-50 dark:bg-static-bg-900">
        <StarryBackground />
        <Header />
        <div className="pt-20 flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-static-accent-600"></div>
            <p className="mt-4 text-static-text-600 dark:text-static-text-400">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-static-bg-50 dark:bg-static-bg-900">
        <StarryBackground />
        <Header />
        <div className="pt-20 flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-static-text-900 dark:text-static-text-50 mb-4">
              Sign in to manage budgets
            </h1>
            <p className="text-static-text-600 dark:text-static-text-400 mb-6">
              Track expenses and split bills with your group
            </p>
            <Link
              href="/sign-in"
              className="inline-block px-6 py-3 bg-static-accent-600 hover:bg-static-accent-700 text-white rounded-lg font-medium transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-static-bg-50 dark:bg-static-bg-900">
      <StarryBackground />
      <Header />
      
      <main className="pt-20 relative z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-static-text-900 dark:text-static-text-50 mb-2">
                Budget & Expenses
              </h1>
              <p className="text-static-text-600 dark:text-static-text-400">
                Track and split expenses with your travel groups
              </p>
            </div>
            <button
              onClick={() => setShowCreateGroupModal(true)}
              className="btn btn-primary btn-md flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Group
            </button>
          </div>

          {groups.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-static-accent-100 dark:bg-static-accent-900 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-static-accent-600 dark:text-static-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-static-text-900 dark:text-static-text-50 mb-2">
                No expense groups yet
              </h3>
              <p className="text-static-text-600 dark:text-static-text-400 mb-6">
                Create your first group to start tracking shared expenses
              </p>
              <button
                onClick={() => setShowCreateGroupModal(true)}
                className="btn btn-primary btn-md"
              >
                Create Your First Group
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group) => {
                const balances = calculateGroupBalances(group);
                const myBalance = balances.find(b => b.memberId === user.id);
                const totalExpenses = group.expenses.reduce((sum, exp) => sum + exp.totalAmount, 0);

                return (
                  <Link
                    key={group.id}
                    href={`/budget/${group.id}`}
                    className="bg-white dark:bg-static-bg-800 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-200 dark:border-gray-700"
                  >
                    {/* Group Icon/Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-static-accent-400 to-static-accent-600 rounded-xl flex items-center justify-center text-2xl">
                        {group.icon || '💰'}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-static-text-900 dark:text-static-text-50">
                          {group.name}
                        </h3>
                        <p className="text-sm text-static-text-600 dark:text-static-text-400">
                          {group.members.length} members
                        </p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-static-text-600 dark:text-static-text-400">
                          Total Expenses
                        </span>
                        <span className="text-sm font-semibold text-static-text-900 dark:text-static-text-50">
                          {formatCurrency(totalExpenses, group.currency)}
                        </span>
                      </div>
                      {myBalance && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-static-text-600 dark:text-static-text-400">
                            Your Balance
                          </span>
                          <span className={`text-sm font-bold ${
                            myBalance.netBalance > 0
                              ? 'text-green-600 dark:text-green-400'
                              : myBalance.netBalance < 0
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-static-text-600 dark:text-static-text-400'
                          }`}>
                            {myBalance.netBalance > 0 && '+'}
                            {formatCurrency(myBalance.netBalance, group.currency)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Members Preview */}
                    <div className="flex -space-x-2">
                      {group.members.slice(0, 4).map((member, idx) => (
                        <div
                          key={member.id}
                          className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white text-xs font-semibold border-2 border-white dark:border-static-bg-800"
                          title={member.name}
                        >
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                      ))}
                      {group.members.length > 4 && (
                        <div className="w-8 h-8 rounded-full bg-static-gray-300 dark:bg-static-gray-700 flex items-center justify-center text-static-text-900 dark:text-static-text-50 text-xs font-semibold border-2 border-white dark:border-static-bg-800">
                          +{group.members.length - 4}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Create Group Modal */}
      {user && (
        <CreateGroupModal
          isOpen={showCreateGroupModal}
          onClose={() => setShowCreateGroupModal(false)}
          onCreateGroup={handleCreateGroup}
          currentUserId={user.id}
          currentUserEmail={user.email || ''}
        />
      )}
    </div>
  );
}
