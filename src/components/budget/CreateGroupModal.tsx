'use client';

import { useState } from 'react';
import { ExpenseGroup, GroupMember } from '@/types/budget';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (group: ExpenseGroup) => void;
  currentUserId: string;
  currentUserEmail: string;
}

export default function CreateGroupModal({
  isOpen,
  onClose,
  onCreateGroup,
  currentUserId,
  currentUserEmail,
}: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState('');
  const [groupIcon, setGroupIcon] = useState('💰');
  const [currency, setCurrency] = useState('USD');
  const [memberEmails, setMemberEmails] = useState<string[]>(['']);
  const [description, setDescription] = useState('');

  const commonEmojis = ['💰', '✈️', '🏖️', '🏠', '🎉', '🍕', '🎬', '⚽', '🎮', '📚'];
  const commonCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF'];

  const handleAddMemberField = () => {
    setMemberEmails([...memberEmails, '']);
  };

  const handleRemoveMemberField = (index: number) => {
    setMemberEmails(memberEmails.filter((_, i) => i !== index));
  };

  const handleMemberEmailChange = (index: number, value: string) => {
    const updated = [...memberEmails];
    updated[index] = value;
    setMemberEmails(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!groupName.trim()) {
      alert('Please enter a group name');
      return;
    }

    // Create group members
    const members: GroupMember[] = [
      {
        id: currentUserId,
        name: currentUserEmail.split('@')[0],
        email: currentUserEmail,
        role: 'owner',
        joinedAt: new Date().toISOString(),
      },
    ];

    // Add invited members (in real app, these would be pending invitations)
    memberEmails.forEach((email, index) => {
      if (email.trim() && email !== currentUserEmail) {
        members.push({
          id: `member-${Date.now()}-${index}`,
          name: email.split('@')[0],
          email: email.trim(),
          role: 'member',
          joinedAt: new Date().toISOString(),
        });
      }
    });

    const newGroup: ExpenseGroup = {
      id: `group-${Date.now()}`,
      name: groupName.trim(),
      description: description.trim(),
      icon: groupIcon,
      currency,
      defaultSplitType: 'equal',
      members,
      expenses: [],
      createdBy: currentUserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onCreateGroup(newGroup);
    
    // Reset form
    setGroupName('');
    setGroupIcon('💰');
    setCurrency('USD');
    setMemberEmails(['']);
    setDescription('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-static-bg-800 rounded-2xl shadow-xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-static-text-900 dark:text-static-text-50">
            Create Expense Group
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5 text-static-text-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Group Name */}
          <div>
            <label className="block text-sm font-medium text-static-text-900 dark:text-static-text-50 mb-2">
              Group Name *
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g., Europe Trip 2025"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-static-accent-500 bg-white dark:bg-static-bg-900 text-static-text-900 dark:text-static-text-50"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-static-text-900 dark:text-static-text-50 mb-2">
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the group"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-static-accent-500 bg-white dark:bg-static-bg-900 text-static-text-900 dark:text-static-text-50"
            />
          </div>

          {/* Icon Selection */}
          <div>
            <label className="block text-sm font-medium text-static-text-900 dark:text-static-text-50 mb-2">
              Group Icon
            </label>
            <div className="flex flex-wrap gap-2">
              {commonEmojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setGroupIcon(emoji)}
                  className={`w-12 h-12 rounded-lg text-2xl flex items-center justify-center transition-all ${
                    groupIcon === emoji
                      ? 'bg-static-accent-500 scale-110'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Currency */}
          <div>
            <label className="block text-sm font-medium text-static-text-900 dark:text-static-text-50 mb-2">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-static-accent-500 bg-white dark:bg-static-bg-900 text-static-text-900 dark:text-static-text-50"
            >
              {commonCurrencies.map((curr) => (
                <option key={curr} value={curr}>
                  {curr}
                </option>
              ))}
            </select>
          </div>

          {/* Invite Members */}
          <div>
            <label className="block text-sm font-medium text-static-text-900 dark:text-static-text-50 mb-2">
              Invite Members (Optional)
            </label>
            <div className="space-y-2">
              {memberEmails.map((email, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => handleMemberEmailChange(index, e.target.value)}
                    placeholder="member@example.com"
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-static-accent-500 bg-white dark:bg-static-bg-900 text-static-text-900 dark:text-static-text-50"
                  />
                  {memberEmails.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMemberField(index)}
                      className="px-3 py-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddMemberField}
                className="text-sm text-static-accent-600 dark:text-static-accent-400 hover:text-static-accent-700 dark:hover:text-static-accent-300 font-medium flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add another member
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-static-text-900 dark:text-static-text-50 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-static-accent-600 hover:bg-static-accent-700 text-white rounded-lg font-medium transition-colors"
            >
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
