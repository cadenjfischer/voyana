'use client';

import { useState, useEffect } from 'react';
import { Expense, GroupMember, ExpenseShare } from '@/types/budget';
import { calculateGroupBalances, formatCurrency, calculateSettlements } from '@/utils/budget';
import { Trip } from '@/types/itinerary';
import AirlineDatePicker from '@/components/AirlineDatePicker';

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
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null);
  
  // Add member form state
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');

  // Add expense form state
  const [expenseStep, setExpenseStep] = useState<'details' | 'split'>(('details'));
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expensePaidBy, setExpensePaidBy] = useState('');
  const [expenseSplitType, setExpenseSplitType] = useState<'equal' | 'custom'>('equal');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([currentUserId]);
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});

  // Scan receipt state
  const [showScanReceiptModal, setShowScanReceiptModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedReceipt, setScannedReceipt] = useState<{
    fullText: string;
    items: Array<{ name: string; price: number; quantity?: number }>;
    subtotal?: number;
    tax?: number;
    tip?: number;
    total?: number;
    imageUrl?: string; // Add imageUrl field
  } | null>(null);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [itemAssignments, setItemAssignments] = useState<Record<number, string[]>>({});
  const [splittingItemIndex, setSplittingItemIndex] = useState<number | null>(null);
  const [itemSplits, setItemSplits] = useState<Record<number, Record<string, number>>>({});
  const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null);
  const [viewingReceiptImageUrl, setViewingReceiptImageUrl] = useState<string | null>(null);
  const [manualTip, setManualTip] = useState<string>(''); // For manual tip entry
  const [tipSplitType, setTipSplitType] = useState<'proportional' | 'equal' | 'custom'>('proportional'); // How to split tip
  const [tipAssignedMembers, setTipAssignedMembers] = useState<string[]>([]); // Members who pay tip (for custom)
  const [showTipSplitModal, setShowTipSplitModal] = useState(false); // Modal for tip split options
  const [showTipInput, setShowTipInput] = useState(false); // Show/hide tip input bubble

  // Lock body scroll when modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    if (showAddExpenseModal || showScanReceiptModal || splittingItemIndex !== null || showTipSplitModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = prev || '';
    }
    return () => {
      document.body.style.overflow = prev || '';
    };
  }, [showAddExpenseModal, showScanReceiptModal, splittingItemIndex, showTipSplitModal]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is outside dropdown
      if (openDropdownIndex !== null && !target.closest('.member-dropdown-container')) {
        setOpenDropdownIndex(null);
      }
    };

    if (openDropdownIndex !== null) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openDropdownIndex]);

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

  // Handle expense member toggle
  const toggleExpenseMember = (memberId: string) => {
    if (selectedMembers.includes(memberId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== memberId));
      const newSplits = { ...customSplits };
      delete newSplits[memberId];
      setCustomSplits(newSplits);
    } else {
      setSelectedMembers([...selectedMembers, memberId]);
    }
  };

  // Handle custom split amount change
  const handleCustomSplitChange = (memberId: string, value: string) => {
    const newSplits = { ...customSplits, [memberId]: value };
    setCustomSplits(newSplits);
  };

  // Calculate remaining amount for custom splits
  const calculateRemainingAmount = () => {
    const total = parseFloat(expenseAmount) || 0;
    const allocated = Object.values(customSplits).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    return total - allocated;
  };

  // Auto-fill remaining amount for last unset member
  const autoFillRemaining = () => {
    const remaining = calculateRemainingAmount();
    const unsetMembers = selectedMembers.filter(id => !customSplits[id] || customSplits[id] === '');
    
    if (unsetMembers.length === 1 && remaining > 0) {
      handleCustomSplitChange(unsetMembers[0], remaining.toFixed(2));
    }
  };

  // Reset expense form
  const resetExpenseForm = () => {
    setExpenseStep('details');
    setExpenseDescription('');
    setExpenseAmount('');
    setExpenseCategory('');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setExpensePaidBy('');
    setExpenseSplitType('equal');
    setSelectedMembers([currentUserId]);
    setCustomSplits({});
  };

  // Handle scan receipt
  const handleScanReceipt = async (file: File) => {
    try {
      setIsScanning(true);
      
      // Create image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Send to API
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/scan-receipt', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to scan receipt');
      }

      const data = await response.json();
      setScannedReceipt(data);
      
      // Initialize item assignments (all items unassigned)
      const initialAssignments: Record<number, string[]> = {};
      data.items.forEach((_: any, index: number) => {
        initialAssignments[index] = [];
      });
      setItemAssignments(initialAssignments);

    } catch (error) {
      console.error('Error scanning receipt:', error);
      alert('Failed to scan receipt. Please try again.');
      setShowScanReceiptModal(false);
      setReceiptImage(null);
      setScannedReceipt(null);
    } finally {
      setIsScanning(false);
    }
  };

  // Toggle member assignment for an item
  const toggleItemAssignment = (itemIndex: number, memberId: string) => {
    setItemAssignments(prev => {
      const current = prev[itemIndex] || [];
      const updated = current.includes(memberId)
        ? current.filter(id => id !== memberId)
        : [...current, memberId];
      return { ...prev, [itemIndex]: updated };
    });
    // Close the dropdown after selection
    setOpenDropdownIndex(null);
  };

  // Create expenses from scanned receipt
  const handleCreateExpensesFromReceipt = () => {
    if (!scannedReceipt || !expensePaidBy) {
      alert('Please select who paid for this receipt');
      return;
    }

    // Assign any unassigned items to the payer
    const finalAssignments = { ...itemAssignments };
    scannedReceipt.items.forEach((_, index) => {
      if (!finalAssignments[index] || finalAssignments[index].length === 0) {
        finalAssignments[index] = [expensePaidBy];
      }
    });

    // Calculate itemized total
    const itemsTotal = scannedReceipt.items.reduce((sum, item) => 
      sum + (item.price * (item.quantity || 1)), 0
    );

    // Determine the base total (before tip)
    const baseTotal = scannedReceipt.total || 
      (scannedReceipt.subtotal && scannedReceipt.tax 
        ? scannedReceipt.subtotal + scannedReceipt.tax 
        : itemsTotal);
    
    // Add manual tip if provided
    const tipAmount = manualTip && parseFloat(manualTip) > 0 ? parseFloat(manualTip) : 0;
    const actualTotal = baseTotal + tipAmount;

    // Calculate the difference between base total and items (tax, fees, etc.)
    const baseDifference = baseTotal - itemsTotal;

    // Calculate who owes what based on item assignments (BEFORE tip)
    const memberTotals: Record<string, number> = {};
    const allParticipants = new Set<string>();

    // Process items, including quantity splits
    scannedReceipt.items.forEach((item, index) => {
      const itemTotal = item.price * (item.quantity || 1);
      const splits = itemSplits[index];

      if (splits && Object.keys(splits).length > 0) {
        // Item was manually split
        const totalSplitQuantity = Object.values(splits).reduce((sum, qty) => sum + qty, 0);
        if (totalSplitQuantity > 0) {
          const pricePerUnit = item.price;
          Object.entries(splits).forEach(([memberId, quantity]) => {
            if (quantity > 0) {
              allParticipants.add(memberId);
              memberTotals[memberId] = (memberTotals[memberId] || 0) + (pricePerUnit * quantity);
            }
          });
        }
      } else {
        // Item was assigned as a whole or left unassigned
        const assignedMembers = finalAssignments[index];
        if (assignedMembers && assignedMembers.length > 0) {
          const perPerson = itemTotal / assignedMembers.length;
          assignedMembers.forEach(memberId => {
            allParticipants.add(memberId);
            memberTotals[memberId] = (memberTotals[memberId] || 0) + perPerson;
          });
        }
      }
    });

    // Distribute base difference (tax, fees) proportionally
    if (Math.abs(baseDifference) > 0.01) {
      const validItemsTotal = Object.keys(memberTotals).reduce((sum, memberId) => sum + memberTotals[memberId], 0);
      if (validItemsTotal > 0.01) {
        Array.from(allParticipants).forEach(memberId => {
          const proportion = memberTotals[memberId] / validItemsTotal;
          memberTotals[memberId] += baseDifference * proportion;
        });
      } else if (allParticipants.size > 0) {
        const perPersonDiff = baseDifference / allParticipants.size;
        Array.from(allParticipants).forEach(memberId => {
          memberTotals[memberId] = (memberTotals[memberId] || 0) + perPersonDiff;
        });
      }
    }

    // NOW distribute the tip according to the selected method
    if (tipAmount > 0) {
      if (tipSplitType === 'proportional') {
        // Default: Distribute tip proportionally based on each person's bill
        const validTotal = Object.keys(memberTotals).reduce((sum, memberId) => sum + memberTotals[memberId], 0);
        if (validTotal > 0.01) {
          Array.from(allParticipants).forEach(memberId => {
            const proportion = memberTotals[memberId] / validTotal;
            memberTotals[memberId] += tipAmount * proportion;
          });
        }
      } else if (tipSplitType === 'equal') {
        // Split tip equally among all participants
        const tipPerPerson = tipAmount / allParticipants.size;
        Array.from(allParticipants).forEach(memberId => {
          memberTotals[memberId] += tipPerPerson;
        });
      } else if (tipSplitType === 'custom') {
        // Split tip only among selected members
        const selectedTipPayers = tipAssignedMembers.length > 0 ? tipAssignedMembers : Array.from(allParticipants);
        if (selectedTipPayers.length > 0) {
          // Calculate tip proportionally among selected members only
          const selectedMemberTotal = selectedTipPayers.reduce((sum, memberId) => 
            sum + (memberTotals[memberId] || 0), 0);
          
          if (selectedMemberTotal > 0.01) {
            selectedTipPayers.forEach(memberId => {
              const proportion = (memberTotals[memberId] || 0) / selectedMemberTotal;
              memberTotals[memberId] = (memberTotals[memberId] || 0) + (tipAmount * proportion);
              allParticipants.add(memberId); // Ensure they're in participants
            });
          } else {
            // If selected members have no bill, split equally
            const tipPerPerson = tipAmount / selectedTipPayers.length;
            selectedTipPayers.forEach(memberId => {
              memberTotals[memberId] = (memberTotals[memberId] || 0) + tipPerPerson;
              allParticipants.add(memberId);
            });
          }
        }
      }
    }

    // Create shares
    const shares: ExpenseShare[] = Array.from(allParticipants).map(memberId => ({
      memberId,
      amount: memberTotals[memberId],
      percentage: (memberTotals[memberId] / actualTotal) * 100,
    }));

    // Simple description - just "Receipt" (expandable dropdown can show details later)
    const description = 'Receipt';

    // Store receipt details as metadata (we'll add this to the expense)
    const receiptDetails = {
      items: scannedReceipt.items.map((item, index) => ({
        ...item,
        assignedTo: finalAssignments[index] || [],
        splits: itemSplits[index] || {}, // Store the detailed splits
      })),
      subtotal: scannedReceipt.subtotal,
      tax: scannedReceipt.tax,
      tip: tipAmount, // Only store manual tip (OCR tips are ignored)
      total: actualTotal,
    };

    // Create single consolidated expense
    const newExpense: Expense = {
      id: `expense-${Date.now()}`,
      groupId: trip.id,
      description,
      totalAmount: actualTotal,
      paidBy: expensePaidBy,
      splitType: 'custom',
      shares,
      participants: Array.from(allParticipants),
      category: 'Food & Dining',
      date: new Date().toISOString().split('T')[0],
      createdBy: currentUserId,
      createdAt: new Date().toISOString(),
      receiptDetails, // Store receipt breakdown for expandable view
      receiptImageUrl: scannedReceipt.imageUrl, // Store the receipt image URL
    } as any;

    // Update trip with new expense
    const updatedExpenses = [...expenses, newExpense];
    const updatedTrip = {
      ...trip,
      expenses: updatedExpenses,
    } as any;
    
    onUpdateTrip(updatedTrip);

    // Reset and close
    setShowScanReceiptModal(false);
    setReceiptImage(null);
    setScannedReceipt(null);
    setItemAssignments({});
    setExpensePaidBy('');
  };

  // Reset scan receipt modal
  const resetScanReceiptModal = () => {
    setShowScanReceiptModal(false);
    setReceiptImage(null);
    setScannedReceipt(null);
    setItemAssignments({});
    setExpensePaidBy('');
    setIsScanning(false);
    setSplittingItemIndex(null);
    setItemSplits({});
    setManualTip(''); // Reset manual tip
    setTipSplitType('proportional'); // Reset tip split type
    setTipAssignedMembers([]); // Reset tip assigned members
    setShowTipInput(false); // Reset tip input visibility
  };

  // Handle quantity change in split modal
  const handleSplitChange = (itemIndex: number, memberId: string, newQuantity: number) => {
    const item = scannedReceipt?.items[itemIndex];
    if (!item) return;

    const currentSplits = itemSplits[itemIndex] || {};
    const otherSplitsTotal = Object.entries(currentSplits)
      .filter(([id]) => id !== memberId)
      .reduce((sum, [, qty]) => sum + qty, 0);

    const maxAllowed = (item.quantity || 1) - otherSplitsTotal;
    const finalQuantity = Math.max(0, Math.min(newQuantity, maxAllowed));

    setItemSplits(prev => ({
      ...prev,
      [itemIndex]: {
        ...prev[itemIndex],
        [memberId]: finalQuantity,
      },
    }));
  };

  // Save the split and assign items accordingly
  const handleSaveSplit = () => {
    if (splittingItemIndex === null) return;

    const splits = itemSplits[splittingItemIndex] || {};
    const assignedMembers = Object.entries(splits)
      .filter(([, qty]) => qty > 0)
      .map(([id]) => id);

    setItemAssignments(prev => ({
      ...prev,
      [splittingItemIndex]: assignedMembers,
    }));

    setSplittingItemIndex(null);
  };

  // Handle add expense
  const handleAddExpense = () => {
    // Route to appropriate handler based on whether
    if (editingExpenseId) {
      handleSaveEditedExpense();
      return;
    }

    if (!expenseDescription.trim() || !expenseAmount || parseFloat(expenseAmount) <= 0) {
      alert('Please enter a valid description and amount');
      return;
    }

    if (selectedMembers.length === 0) {
      alert('Please select at least one member');
      return;
    }

    const totalAmount = parseFloat(expenseAmount);

    // Calculate shares
    let shares: ExpenseShare[] = [];
    
    if (expenseSplitType === 'equal') {
      const amountPerPerson = totalAmount / selectedMembers.length;
      shares = selectedMembers.map(memberId => ({
        memberId,
        amount: amountPerPerson,
        percentage: (amountPerPerson / totalAmount) * 100,
      }));
    } else {
      // Custom split
      const totalAllocated = Object.entries(customSplits)
        .filter(([id]) => selectedMembers.includes(id))
        .reduce((sum, [, val]) => sum + (parseFloat(val) || 0), 0);

      if (Math.abs(totalAllocated - totalAmount) > 0.01) {
        alert(`Split amounts must equal ${formatCurrency(totalAmount, currency)}`);
        return;
      }

      shares = selectedMembers.map(memberId => {
        const amount = parseFloat(customSplits[memberId]) || 0;
        return {
          memberId,
          amount,
          percentage: (amount / totalAmount) * 100,
        };
      });
    }

    const newExpense: Expense = {
      id: `expense-${Date.now()}`,
      groupId: trip.id,
      description: expenseDescription.trim(),
      totalAmount,
      paidBy: expensePaidBy,
      splitType: expenseSplitType === 'equal' ? 'equal' : 'custom',
      shares,
      participants: selectedMembers,
      category: expenseCategory || 'Other',
      date: expenseDate,
      createdBy: currentUserId,
      createdAt: new Date().toISOString(),
    };

    const updatedExpenses = [...expenses, newExpense];
    
    const updatedTrip = {
      ...trip,
      expenses: updatedExpenses,
    } as any;
    
    onUpdateTrip(updatedTrip);
    resetExpenseForm();
    setShowAddExpenseModal(false);
  };

  const handleEditExpense = (expense: Expense) => {
    // Populate form with expense data
    setExpenseDescription(expense.description);
    setExpenseAmount(expense.totalAmount.toString());
    setExpenseCategory(expense.category || '');
    setExpenseDate(expense.date);
    setExpensePaidBy(expense.paidBy);
    setExpenseSplitType(expense.splitType === 'equal' ? 'equal' : 'custom');
    setSelectedMembers(expense.participants);

    // Set custom splits if it's a custom split
    if (expense.splitType === 'custom' && expense.shares) {
      const splits: Record<string, string> = {};
      expense.shares.forEach(share => {
        splits[share.memberId] = share.amount.toFixed(2);
      });
      setCustomSplits(splits);
    }

    // Set editing state
    setEditingExpenseId(expense.id);
    setShowAddExpenseModal(true);
  };

  const handleDeleteExpense = (expenseId: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    const updatedExpenses = expenses.filter(exp => exp.id !== expenseId);
    const updatedTrip = {
      ...trip,
      expenses: updatedExpenses,
    } as any;
    
    onUpdateTrip(updatedTrip);
  };

  const handleSaveEditedExpense = () => {
    if (!expenseDescription.trim() || !expenseAmount || parseFloat(expenseAmount) <= 0) {
      alert('Please enter a valid description and amount');
      return;
    }

    if (selectedMembers.length === 0) {
      alert('Please select at least one member');
      return;
    }

    const totalAmount = parseFloat(expenseAmount);

    // Calculate shares
    let shares: ExpenseShare[] = [];
    
    if (expenseSplitType === 'equal') {
      const amountPerPerson = totalAmount / selectedMembers.length;
      shares = selectedMembers.map(memberId => ({
        memberId,
        amount: amountPerPerson,
        percentage: (amountPerPerson / totalAmount) * 100,
      }));
    } else {
      // Custom split
      const totalAllocated = Object.entries(customSplits)
        .filter(([id]) => selectedMembers.includes(id))
        .reduce((sum, [, val]) => sum + (parseFloat(val) || 0), 0);

      if (Math.abs(totalAllocated - totalAmount) > 0.01) {
        alert(`Split amounts must equal ${formatCurrency(totalAmount, currency)}`);
        return;
      }

      shares = selectedMembers.map(memberId => {
        const amount = parseFloat(customSplits[memberId]) || 0;
        return {
          memberId,
          amount,
          percentage: (amount / totalAmount) * 100,
        };
      });
    }

    const updatedExpenses = expenses.map(exp => {
      if (exp.id === editingExpenseId) {
        return {
          ...exp,
          description: expenseDescription.trim(),
          totalAmount,
          paidBy: expensePaidBy,
          splitType: expenseSplitType === 'equal' ? 'equal' : 'custom',
          shares,
          participants: selectedMembers,
          category: expenseCategory || 'Other',
          date: expenseDate,
        } as Expense;
      }
      return exp;
    });

    const updatedTrip = {
      ...trip,
      expenses: updatedExpenses,
    } as any;
    
    onUpdateTrip(updatedTrip);
    resetExpenseForm();
    setEditingExpenseId(null);
    setShowAddExpenseModal(false);
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
  const payer = members.find((m) => m.id === expensePaidBy);

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
            <select className="bg-transparent border-none text-sm font-medium text-static-text-700 dark:text-static-text-300 focus:outline-none cursor-pointer appearance-none"
              style={{ 
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1rem'
              }}>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-4 4m0 0l4-4-4-4" />
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
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <button
            onClick={() => setShowAddExpenseModal(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-static-bg-700 dark:bg-static-bg-700 hover:bg-static-bg-600 dark:hover:bg-static-bg-600 text-white rounded-lg font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add expense
          </button>

          {/* Scan Receipt Button */}
          <button
            onClick={() => setShowScanReceiptModal(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-static-bg-800 dark:bg-static-bg-800 hover:bg-static-bg-700 dark:hover:bg-static-bg-700 text-static-text-50 rounded-lg font-medium transition-colors border border-gray-700 dark:border-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Scan receipt
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
          <div className="p-8 lg:pr-96 xl:pr-[28rem]">
            {/* Expense List */}
            <div className="max-w-4xl">
              {expenses.length === 0 ? (
                <div className="text-center py-20">
                  <svg className="w-20 h-20 text-static-text-400 dark:text-static-text-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
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
                    const expenseWithReceipt = expense as any;
                    const hasReceiptDetails = expenseWithReceipt.receiptDetails && expenseWithReceipt.receiptDetails.items;
                    const hasReceiptImage = expenseWithReceipt.receiptImageUrl;
                    const isExpanded = expandedExpenseId === expense.id;
                    
                    return (
                      <div
                        key={expense.id}
                        className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start gap-4">
                          {/* Expense Icon/Avatar */}
                          <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 relative group">
                            {hasReceiptImage ? (
                              <button
                                onClick={() => setViewingReceiptImageUrl(expenseWithReceipt.receiptImageUrl)}
                                className="w-full h-full rounded-lg overflow-hidden hover:opacity-75 transition-opacity"
                                title="View receipt"
                              >
                                <img src={expenseWithReceipt.receiptImageUrl} alt="Receipt" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                  <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                  </svg>
                                </div>
                              </button>
                            ) : expense.receiptPhoto ? (
                              <img src={expense.receiptPhoto} alt="" className="w-full h-full object-cover rounded-lg" />
                            ) : hasReceiptDetails ? (
                              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            ) : (
                              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            )}
                          </div>

                          {/* Expense Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-static-text-900 dark:text-static-text-50">
                                {expense.description}
                              </h3>
                              {hasReceiptImage && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  Receipt
                                </span>
                              )}
                              {hasReceiptDetails && (
                                <button
                                  onClick={() => setExpandedExpenseId(isExpanded ? null : expense.id)}
                                  className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                                >
                                  {isExpanded ? '▼ Hide details' : '▶ View details'}
                                </button>
                              )}
                            </div>
                            <p className="text-sm text-static-text-600 dark:text-static-text-400 mt-1">
                              by <span className="font-medium">{payer?.name || 'Unknown'}</span>
                            </p>
                            <p className="text-xs text-static-text-500 dark:text-static-text-500 mt-1">
                              {expense.category || 'Other'}
                            </p>

                            {/* Expandable Receipt Details */}
                            {hasReceiptDetails && isExpanded && (
                              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                {/* Show receipt image thumbnail if available */}
                                {hasReceiptImage && (
                                  <button
                                    onClick={() => setViewingReceiptImageUrl(expenseWithReceipt.receiptImageUrl)}
                                    className="mb-4 flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                  >
                                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">View original receipt image</span>
                                  </button>
                                )}
                                
                                <div className="space-y-0">
                                  {expenseWithReceipt.receiptDetails.items.map((item: any, idx: number) => {
                                    const assignedMembers = item.assignedTo || [];
                                    const splits = item.splits || {};
                                    const hasSplits = Object.keys(splits).length > 0 && Object.values(splits).some(qty => (qty as number) > 0);

                                    return (
                                      <div key={idx} className="text-xs py-1 px-2 border-b border-gray-200 dark:border-gray-800 last:border-b-0">
                                        <div className="flex justify-between items-center">
                                          <span className="text-static-text-800 dark:text-static-text-200 font-medium">
                                            {item.name}
                                            <span className="text-static-text-500 dark:text-static-text-500 ml-2">
                                              {hasSplits ? (
                                                Object.entries(splits).map(([memberId, qty]) => {
                                                  const qtyNum = qty as number;
                                                  if (qtyNum <= 0) return null;
                                                  const member = members.find(m => m.id === memberId);
                                                  return `${member?.name || 'Unknown'} (${qtyNum})`;
                                                }).filter(Boolean).join(', ')
                                              ) : (
                                                assignedMembers.map((memberId: string) => {
                                                  const member = members.find(m => m.id === memberId);
                                                  return member?.name || 'Unknown';
                                                }).join(', ')
                                              )}
                                            </span>
                                          </span>
                                          <span className="text-static-text-900 dark:text-static-text-50 font-semibold ml-2">
                                            {formatCurrency(item.price * (item.quantity || 1), currency)}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                  
                                  {/* Show suggested tax/tip if present */}
                                  {(expenseWithReceipt.receiptDetails.tax || expenseWithReceipt.receiptDetails.tip) && (
                                    <div className="text-xs text-static-text-500 italic px-2 py-1 border-t border-gray-200 dark:border-gray-800">
                                      Note: Tax and tip (if any) are distributed proportionally among participants.
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Amount and Actions */}
                          <div className="flex items-start gap-3">
                            <div className="text-right flex-shrink-0">
                              <p className="text-xl font-bold text-static-text-900 dark:text-static-text-50">
                                {formatCurrency(expense.totalAmount, currency)}
                              </p>
                              <p className="text-xs text-static-text-500 dark:text-static-text-500 mt-1">
                                {formatCurrency(0, currency)}
                              </p>
                            </div>

                            {/* Edit and Delete Buttons */}
                            <div className="flex items-center gap-1 pt-1">
                              <button
                                onClick={() => handleEditExpense(expense)}
                                className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                title="Edit expense"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(expense.id)}
                                className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                                title="Delete expense"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
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
          <div className="p-8 lg:pr-96 xl:pr-[28rem]">
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
          <div className="p-8 lg:pr-96 xl:pr-[28rem]">
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
        <div className="hidden lg:block lg:fixed lg:right-8 lg:top-24 lg:w-80 xl:w-96">
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

      {/* Add Expense Modal */}
      {showAddExpenseModal && (
        <div 
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 p-4 overflow-hidden overscroll-none"
          onClick={() => {
            resetExpenseForm();
            setShowAddExpenseModal(false);
          }}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-2xl font-bold text-static-text-900 dark:text-static-text-50">
                {editingExpenseId ? 'Edit Expense' : 'Add Expense'}
              </h2>
              <button
                onClick={() => {
                  resetExpenseForm();
                  setEditingExpenseId(null);
                  setShowAddExpenseModal(false);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-static-text-600 dark:text-static-text-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Step Indicator */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setExpenseStep('details')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    expenseStep === 'details'
                      ? 'bg-static-bg-700 text-white'
                      : 'text-static-text-600 dark:text-static-text-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                    expenseStep === 'details' ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-700'
                  }`}>
                    1
                  </span>
                  Details
                </button>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <button
                  onClick={() => {
                    if (expenseDescription && expenseAmount) {
                      setExpenseStep('split');
                    }
                  }}
                  disabled={!expenseDescription || !expenseAmount}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    expenseStep === 'split'
                      ? 'bg-static-bg-700 text-white'
                      : 'text-static-text-600 dark:text-static-text-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                    expenseStep === 'split' ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-700'
                  }`}>
                    2
                  </span>
                  Split
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="relative p-6">
              {expenseStep === 'details' ? (
                <div className="space-y-4">
                  {/* Show Payer Selection First if not selected */}
                  {!expensePaidBy ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold text-static-text-900 dark:text-static-text-50 mb-2">
                          Who paid for this expense?
                        </h3>
                        <p className="text-sm text-static-text-600 dark:text-static-text-400 mb-4">
                          Select the person who paid
                        </p>
                      </div>
                      
                      {/* Member List */}
                      <div className="space-y-3">
                        {members.map((member) => (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => setExpensePaidBy(member.id)}
                            className="w-full flex items-center gap-3 p-4 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:border-static-accent-500 dark:hover:border-static-accent-500 transition-colors bg-transparent"
                          >
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 text-left">
                              <p className="font-medium text-static-text-900 dark:text-static-text-50">
                                {member.name}
                                {member.id === currentUserId && (
                                  <span className="ml-2 text-sm text-static-text-500">(You)</span>
                                )}
                              </p>
                              {member.email && (
                                <p className="text-sm text-static-text-600 dark:text-static-text-400">
                                  {member.email}
                                </p>
                              )}
                            </div>
                            <svg className="w-5 h-5 text-static-text-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Back button to change payer */}
                      <button
                        type="button"
                        onClick={() => setExpensePaidBy('')}
                        className="flex items-center gap-2 text-sm text-static-text-600 dark:text-static-text-400 hover:text-static-text-900 dark:hover:text-static-text-50 transition-colors mb-4"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Change payer ({payer?.name})
                      </button>

                      {/* Description */}
                      <div>
                        <label className="block text-sm font-medium text-static-text-900 dark:text-static-text-50 mb-2">
                          Description <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={expenseDescription}
                          onChange={(e) => setExpenseDescription(e.target.value)}
                          placeholder="e.g., Dinner at restaurant"
                          className="w-full px-4 py-3 bg-transparent border border-gray-600 dark:border-gray-600 rounded-lg text-static-text-50 placeholder:text-static-text-700 dark:placeholder:text-static-text-600 focus:outline-none focus:border-static-accent-500 transition-colors"
                          autoFocus
                        />
                      </div>

                      {/* Amount */}
                      <div>
                        <label className="block text-sm font-medium text-static-text-900 dark:text-static-text-50 mb-2">
                          Amount <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-3 border border-gray-600 dark:border-gray-600 rounded-lg focus-within:border-static-accent-500 transition-colors px-4 py-3">
                          <span className="text-sm font-medium text-static-text-500">
                            {currency}
                          </span>
                          <input
                            type="number"
                            value={expenseAmount}
                            onChange={(e) => setExpenseAmount(e.target.value)}
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            className="flex-1 bg-transparent text-static-text-50 placeholder:text-static-text-700 dark:placeholder:text-static-text-600 focus:outline-none text-xl"
                          />
                        </div>
                      </div>

                      {/* Category */}
                      <div>
                        <label className="block text-sm font-medium text-static-text-900 dark:text-static-text-50 mb-2">
                          Category
                        </label>
                        <select
                          value={expenseCategory}
                          onChange={(e) => setExpenseCategory(e.target.value)}
                          className={`w-full px-4 py-3 bg-transparent border border-gray-600 dark:border-gray-600 rounded-lg focus:outline-none focus:border-static-accent-500 transition-colors appearance-none cursor-pointer ${
                            expenseCategory ? 'text-static-text-50' : 'text-static-text-600 dark:text-static-text-500'
                          }`}
                          style={{ 
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                            backgroundPosition: 'right 0.75rem center',
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: '1.25rem'
                          }}
                        >
                          <option value="">Select category</option>
                          <option value="Food">🍽️ Food & Drink</option>
                          <option value="Lodging">🛏️ Lodging</option>
                          <option value="Transport">🚗 Transport</option>
                          <option value="Activities">📸 See & Do</option>
                          <option value="Shopping">🛍️ Shopping</option>
                          <option value="Other">⋯ Other</option>
                        </select>
                      </div>

                      {/* Date */}
                      <div>
                        <label className="block text-sm font-medium text-static-text-900 dark:text-static-text-50 mb-2">
                          Date
                        </label>
                        <AirlineDatePicker
                          startDate={expenseDate}
                          endDate=""
                          onStartDateChange={(date) => setExpenseDate(date)}
                          onEndDateChange={() => {}}
                          single={true}
                        />
                      </div>

                      {/* Next Button */}
                      <div className="pt-4">
                        <button
                          onClick={() => setExpenseStep('split')}
                          disabled={!expenseDescription.trim() || !expenseAmount || parseFloat(expenseAmount) <= 0}
                          className="w-full px-4 py-3 bg-static-bg-700 hover:bg-static-bg-600 disabled:bg-gray-400 text-white disabled:text-static-text-700 rounded-lg font-medium transition-colors"
                        >
                          Next: Split Expense
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Split Type */}
                  <div>
                    <label className="block text-sm font-medium text-static-text-900 dark:text-static-text-50 mb-3">
                      How should this be split?
                    </label>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setExpenseSplitType('equal');
                          setCustomSplits({});
                        }}
                        className={`flex-1 px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                          expenseSplitType === 'equal'
                            ? 'border-static-bg-700 bg-static-bg-700 text-white'
                            : 'border-gray-300 dark:border-gray-600 text-static-text-700 dark:text-static-text-300 hover:border-static-bg-600'
                        }`}
                      >
                        Equal Split
                      </button>
                      <button
                        onClick={() => setExpenseSplitType('custom')}
                        className={`flex-1 px-4 py-3 rounded-lg border-2 font-medium transition-colors ${
                          expenseSplitType === 'custom'
                            ? 'border-static-bg-700 bg-static-bg-700 text-white'
                            : 'border-gray-300 dark:border-gray-600 text-static-text-700 dark:text-static-text-300 hover:border-static-bg-600'
                        }`}
                      >
                        Custom Amounts
                      </button>
                    </div>
                  </div>

                  {/* Member Selection */}
                  <div>
                    <label className="block text-sm font-medium text-static-text-900 dark:text-static-text-50 mb-3">
                      Split between
                    </label>
                    <div className="space-y-2">
                      {members.map(member => {
                        const isSelected = selectedMembers.includes(member.id);
                        const equalAmount = expenseSplitType === 'equal' && isSelected
                          ? (parseFloat(expenseAmount) || 0) / selectedMembers.length
                          : 0;
                        
                        return (
                          <div
                            key={member.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                              isSelected
                                ? 'border-static-bg-700 bg-static-bg-700/10'
                                : 'border-gray-300 dark:border-gray-600'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleExpenseMember(member.id)}
                              className="w-5 h-5 rounded border-gray-300 text-static-bg-700 focus:ring-static-accent-500"
                            />
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-bold">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-static-text-900 dark:text-static-text-50">
                                {member.name}
                                {member.id === currentUserId && (
                                  <span className="ml-2 text-xs text-static-text-500">(You)</span>
                                )}
                              </p>
                            </div>
                            {isSelected && (
                              <div className="flex items-center gap-2">
                                {expenseSplitType === 'custom' ? (
                                  <div className="flex items-center gap-2 px-3 py-2 border border-gray-600 dark:border-gray-600 rounded-lg focus-within:border-static-accent-500 transition-colors">
                                    <span className="text-sm text-static-text-500">
                                      {currency}
                                    </span>
                                    <input
                                      type="number"
                                      value={customSplits[member.id] || ''}
                                      onChange={(e) => handleCustomSplitChange(member.id, e.target.value)}
                                      onBlur={autoFillRemaining}
                                      placeholder="0.00"
                                      step="0.01"
                                      min="0"
                                      className="w-24 bg-transparent text-static-text-900 dark:text-static-text-50 placeholder:text-static-text-600 dark:placeholder:text-static-text-500 focus:outline-none text-right"
                                    />
                                  </div>
                                ) : (
                                  <span className="text-lg font-bold text-static-text-900 dark:text-static-text-50">
                                    {formatCurrency(equalAmount, currency)}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Remaining Amount Indicator for Custom Split */}
                  {expenseSplitType === 'custom' && selectedMembers.length > 0 && (
                    <div className={`p-4 rounded-lg ${
                      Math.abs(calculateRemainingAmount()) < 0.01
                        ? 'bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700'
                        : 'bg-static-accent-100 dark:bg-static-accent-900/30 border border-static-accent-300 dark:border-static-accent-700'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-static-text-900 dark:text-static-text-50">
                          {Math.abs(calculateRemainingAmount()) < 0.01 ? '✓ Split complete' : 'Remaining to allocate'}
                        </span>
                        <span className={`text-lg font-bold ${
                          Math.abs(calculateRemainingAmount()) < 0.01
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-static-accent-700 dark:text-static-accent-400'
                        }`}>
                          {formatCurrency(Math.max(0, calculateRemainingAmount()), currency)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => setExpenseStep('details')}
                      className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-static-text-900 dark:text-static-text-50 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleAddExpense}
                      disabled={selectedMembers.length === 0}
                      className="flex-1 px-4 py-3 bg-static-bg-700 hover:bg-static-bg-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white disabled:text-static-text-700 rounded-lg font-medium transition-colors"
                    >
                      {editingExpenseId ? 'Save Changes' : 'Add Expense'}
                    </button>
                  </div>
                </div>
              )}
            </div>
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
                  className="w-full px-4 py-3 bg-transparent border border-gray-600 dark:border-gray-600 rounded-lg text-static-text-900 dark:text-static-text-50 placeholder:text-static-text-700 dark:placeholder:text-static-text-600 focus:outline-none focus:border-static-accent-500 transition-colors"
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
                  className="w-full px-4 py-3 bg-transparent border border-gray-600 dark:border-gray-600 rounded-lg text-static-text-900 dark:text-static-text-50 placeholder:text-static-text-700 dark:placeholder:text-static-text-600 focus:outline-none focus:border-static-accent-500 transition-colors"
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
                  className="w-full px-4 py-3 bg-transparent border border-gray-600 dark:border-gray-600 rounded-lg text-static-text-900 dark:text-static-text-50 placeholder:text-static-text-700 dark:placeholder:text-static-text-600 focus:outline-none focus:border-static-accent-500 transition-colors"
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

      {/* Scan Receipt Modal */}
      {showScanReceiptModal && (
        <div 
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40"
          onClick={resetScanReceiptModal}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-static-text-900 dark:text-static-text-50">
                Scan Receipt
              </h2>
              <p className="text-static-text-600 dark:text-static-text-400 mt-1">
                Upload a photo of your receipt to split items automatically
              </p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {!receiptImage && !isScanning && (
                <div className="space-y-4">
                  <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-600 dark:border-gray-600 rounded-lg cursor-pointer hover:border-gray-500 dark:hover:border-gray-500 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-12 h-12 mb-4 text-static-text-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="mb-2 text-sm text-static-text-600 dark:text-static-text-400">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-static-text-500">PNG, JPG, JPEG (MAX. 10MB)</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleScanReceipt(file);
                      }}
                    />
                  </label>
                </div>
              )}

              {isScanning && (
                <div className="flex flex-col items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-300 border-t-static-bg-700 mb-4"></div>
                  <p className="text-static-text-600 dark:text-static-text-400">Scanning receipt...</p>
                </div>
              )}

              {receiptImage && !scannedReceipt && !isScanning && (
                <div className="flex flex-col items-center">
                  <img src={receiptImage} alt="Receipt" className="max-h-96 rounded-lg mb-4" />
                </div>
              )}

              {scannedReceipt && (
                <div className="space-y-6">
                  {/* Receipt Preview */}
                  {receiptImage && (
                    <div className="flex items-start gap-4 p-4 bg-static-bg-100 dark:bg-static-bg-800 rounded-lg">
                      <img src={receiptImage} alt="Receipt" className="w-24 h-32 object-cover rounded" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-static-text-900 dark:text-static-text-50 mb-2">
                          Receipt Scanned
                        </h3>
                        <div className="text-sm text-static-text-600 dark:text-static-text-400 space-y-1">
                          {scannedReceipt.subtotal && (
                            <div className="flex justify-between">
                              <span>Subtotal:</span>
                              <span>{formatCurrency(scannedReceipt.subtotal, currency)}</span>
                            </div>
                          )}
                          {scannedReceipt.tax && (
                            <div className="flex justify-between">
                              <span>Tax:</span>
                              <span>{formatCurrency(scannedReceipt.tax, currency)}</span>
                            </div>
                          )}
                          
                          {/* Show the actual total - calculated or detected */}
                          {(() => {
                            const itemsTotal = scannedReceipt.items.reduce((sum, item) => 
                              sum + (item.price * (item.quantity || 1)), 0
                            );
                            const displayTotal = scannedReceipt.total || 
                              (scannedReceipt.subtotal && scannedReceipt.tax 
                                ? scannedReceipt.subtotal + scannedReceipt.tax 
                                : itemsTotal);
                            
                            return (
                              <div className="flex justify-between font-bold text-lg text-static-text-900 dark:text-static-text-50 pt-2 mt-1 border-t-2 border-gray-300 dark:border-gray-600">
                                <span>Total Amount:</span>
                                <span>{formatCurrency(displayTotal, currency)}</span>
                              </div>
                            );
                          })()}

                          {/* Manual Tip Input - iOS Bubble Style */}
                          <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-700 relative">
                            {!manualTip ? (
                              // Show button to open tip input
                              <>
                                <button
                                  type="button"
                                  onClick={() => setShowTipInput(!showTipInput)}
                                  className="w-full px-4 py-2.5 bg-static-bg-100 dark:bg-gray-800 hover:bg-static-bg-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-static-text-900 dark:text-static-text-50 transition-colors flex items-center justify-center gap-2"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                  Add Tip (Optional)
                                </button>

                                {/* iOS-style bubble popup */}
                                {showTipInput && (
                                  <>
                                    {/* Backdrop */}
                                    <div
                                      className="fixed inset-0 z-[9999]"
                                      onClick={() => setShowTipInput(false)}
                                    />
                                    
                                    {/* Bubble */}
                                    <div className="absolute left-0 right-0 top-full mt-2 z-[10000] animate-in fade-in slide-in-from-top-2 duration-200">
                                      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 mx-2">
                                        <label className="block text-xs font-medium text-static-text-600 dark:text-static-text-400 mb-2">
                                          Tip Amount
                                        </label>
                                        <div className="flex gap-2">
                                          <div className="relative flex-1">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-static-text-600 dark:text-static-text-400 font-medium">
                                              {currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£'}
                                            </span>
                                            <input
                                              type="number"
                                              id="tip-input-bubble"
                                              placeholder="0.00"
                                              step="0.01"
                                              min="0"
                                              autoFocus
                                              className="w-full pl-8 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-static-text-900 dark:text-static-text-50 placeholder:text-static-text-400 focus:outline-none focus:ring-2 focus:ring-static-bg-700 focus:border-transparent transition-all"
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                  const value = (e.target as HTMLInputElement).value;
                                                  if (value && parseFloat(value) > 0) {
                                                    setManualTip(value);
                                                    setShowTipInput(false);
                                                  }
                                                } else if (e.key === 'Escape') {
                                                  setShowTipInput(false);
                                                }
                                              }}
                                            />
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const input = document.getElementById('tip-input-bubble') as HTMLInputElement;
                                              if (input.value && parseFloat(input.value) > 0) {
                                                setManualTip(input.value);
                                                setShowTipInput(false);
                                              }
                                            }}
                                            className="px-4 py-2.5 bg-static-bg-700 hover:bg-static-bg-600 text-white rounded-xl font-medium transition-colors whitespace-nowrap"
                                          >
                                            Add
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </>
                            ) : (
                              // Show final amount with tip when set
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-static-text-900 dark:text-static-text-50">
                                    Tip Added:
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                                      {formatCurrency(parseFloat(manualTip), currency)}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setManualTip('')}
                                      className="text-xs text-static-text-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                      title="Remove tip"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                                <div className="flex justify-between text-base font-bold text-static-text-900 dark:text-static-text-50 pt-2 border-t border-gray-300 dark:border-gray-600">
                                  <span>Total with Tip:</span>
                                  <span className="text-green-600 dark:text-green-400">
                                    {formatCurrency(
                                      (scannedReceipt.total || 
                                        (scannedReceipt.subtotal && scannedReceipt.tax 
                                          ? scannedReceipt.subtotal + scannedReceipt.tax 
                                          : scannedReceipt.items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0)
                                        )) + parseFloat(manualTip), 
                                      currency
                                    )}
                                  </span>
                                </div>

                                {/* Tip Split Options Button */}
                                <button
                                  type="button"
                                  onClick={() => setShowTipSplitModal(true)}
                                  className="w-full mt-2 px-4 py-2.5 bg-static-bg-100 dark:bg-gray-800 hover:bg-static-bg-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-static-text-900 dark:text-static-text-50 transition-colors flex items-center justify-between"
                                >
                                  <span>
                                    {tipSplitType === 'proportional' && 'Split tip proportionally'}
                                    {tipSplitType === 'equal' && 'Split tip equally'}
                                    {tipSplitType === 'custom' && `Custom tip split (${tipAssignedMembers.length} people)`}
                                  </span>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Who Paid */}
                  <div>
                    <label className="block text-sm font-medium text-static-text-900 dark:text-static-text-50 mb-2">
                      Who paid for this? *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {members.map((member) => (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => setExpensePaidBy(member.id)}
                          className={`px-4 py-3 rounded-lg border-2 transition-all ${
                            expensePaidBy === member.id
                              ? 'border-static-bg-700 bg-static-bg-700/10'
                              : 'border-gray-600 hover:border-gray-500'
                          }`}
                        >
                          <div className="font-medium text-static-text-900 dark:text-static-text-50">
                            {member.name}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Items List */}
                  {scannedReceipt.items && scannedReceipt.items.length > 0 ? (
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-semibold text-static-text-900 dark:text-static-text-50">
                          Assign items to group members
                        </h3>
                        {scannedReceipt.items.some((_, i) => !itemAssignments[i] || itemAssignments[i].length === 0) && (
                          <span className="text-xs text-static-text-500 dark:text-static-text-400">
                            Unassigned items will be split equally
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        {scannedReceipt.items.map((item, index) => {
                        const isAssigned = itemAssignments[index] && itemAssignments[index].length > 0;
                        const assignedMembers = itemAssignments[index] || [];
                        const showMemberDropdown = openDropdownIndex === index;
                        
                        return (
                          <div
                            key={index}
                            className={`relative p-3 rounded-lg border transition-all member-dropdown-container ${
                              isAssigned
                                ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
                                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              {/* Item name and quantity */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-static-text-900 dark:text-static-text-50 truncate">
                                    {item.name}
                                  </h4>
                                  {item.quantity && item.quantity > 1 && (
                                    <span className="text-xs text-static-text-500 dark:text-static-text-400 flex-shrink-0">
                                      Qty: {item.quantity}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Price */}
                              <div className="font-semibold text-static-text-900 dark:text-static-text-50 flex-shrink-0">
                                {formatCurrency(item.price * (item.quantity || 1), currency)}
                              </div>

                              {/* Status badge */}
                              {!isAssigned && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-static-text-600 dark:text-static-text-400 rounded-full flex-shrink-0">
                                  Unassigned
                                </span>
                              )}
                            </div>

                            {/* Assigned members or assignment button */}
                            <div className="mt-2 flex items-center gap-2">
                              {isAssigned ? (
                                <>
                                  {/* Show assigned members as compact chips */}
                                  <div className="flex items-center gap-1 flex-wrap flex-1">
                                    {assignedMembers.map((memberId) => {
                                      const member = members.find(m => m.id === memberId);
                                      if (!member) return null;
                                      return (
                                        <div
                                          key={memberId}
                                          className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 border border-blue-300 dark:border-blue-700 rounded-full"
                                        >
                                          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold">
                                            {member.name.charAt(0).toUpperCase()}
                                          </div>
                                          <span className="text-xs font-medium text-static-text-700 dark:text-static-text-300">
                                            {member.name}
                                          </span>
                                          <button
                                            onClick={() => toggleItemAssignment(index, memberId)}
                                            className="ml-0.5 text-static-text-500 hover:text-static-text-700 dark:hover:text-static-text-200"
                                          >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                          </button>
                                        </div>
                                      );
                                    })}
                                    <button
                                      onClick={() => setOpenDropdownIndex(showMemberDropdown ? null : index)}
                                      className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center text-static-text-600 dark:text-static-text-400"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                      </svg>
                                    </button>
                                  </div>
                                  <div className="text-xs text-static-text-600 dark:text-static-text-400 flex-shrink-0">
                                    {formatCurrency(
                                      (item.price * (item.quantity || 1)) / assignedMembers.length,
                                      currency
                                    )}/person
                                  </div>
                                </>
                              ) : (
                                <button
                                  onClick={() => setOpenDropdownIndex(showMemberDropdown ? null : index)}
                                  className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                  Assign members
                                </button>
                              )}

                              {/* Split item button for quantities > 1 */}
                              {item.quantity && item.quantity > 1 && (
                                <button
                                  onClick={() => setSplittingItemIndex(index)}
                                  className="text-xs font-medium text-static-text-600 dark:text-static-text-400 hover:text-static-text-900 dark:hover:text-static-text-100 flex items-center gap-1 flex-shrink-0"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                  </svg>
                                  Split
                                </button>
                              )}
                            </div>

                            {/* Member dropdown */}
                            {showMemberDropdown && (
                              <div className="absolute left-0 right-0 top-full mt-1 z-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-2">
                                {members.map((member) => {
                                  const isSelected = assignedMembers.includes(member.id);
                                  return (
                                    <button
                                      key={member.id}
                                      onClick={() => {
                                        toggleItemAssignment(index, member.id);
                                      }}
                                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                                        isSelected
                                          ? 'bg-blue-100 dark:bg-blue-900/50 text-static-text-900 dark:text-static-text-50'
                                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-static-text-700 dark:text-static-text-300'
                                      }`}
                                    >
                                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                        {member.name.charAt(0).toUpperCase()}
                                      </div>
                                      <span className="flex-1 font-medium">{member.name}</span>
                                      {isSelected && (
                                        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-300 dark:border-yellow-700/50 rounded-lg text-center">
                      <p className="text-static-text-700 dark:text-static-text-300">
                        No items detected. The receipt may be unclear or in an unexpected format.
                      </p>
                      <button
                        onClick={() => {
                          setReceiptImage(null);
                          setScannedReceipt(null);
                        }}
                        className="mt-3 text-static-bg-700 hover:underline font-medium"
                      >
                        Try another photo
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <button
                type="button"
                onClick={resetScanReceiptModal}
                className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-static-text-900 dark:text-static-text-50 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              {scannedReceipt && (
                <button
                  type="button"
                  onClick={handleCreateExpensesFromReceipt}
                  disabled={!expensePaidBy}
                  className="flex-1 px-4 py-3 bg-static-bg-700 dark:bg-static-bg-700 hover:bg-static-bg-600 dark:hover:bg-static-bg-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:text-static-text-700"
                >
                  Create Expenses ({scannedReceipt.items.filter((_, i) => itemAssignments[i]?.length > 0).length} assigned)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Item Split Modal */}
      {splittingItemIndex !== null && scannedReceipt && (
        <div
          className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/50"
          onClick={() => setSplittingItemIndex(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const item = scannedReceipt.items[splittingItemIndex];
              if (!item) return null;

              const currentSplits = itemSplits[splittingItemIndex] || {};
              const totalAssigned = Object.values(currentSplits).reduce((sum, qty) => sum + qty, 0);
              const remainingToAssign = (item.quantity || 1) - totalAssigned;

              return (
                <>
                  <h2 className="text-2xl font-bold text-static-text-900 dark:text-static-text-50 mb-2">
                    Split "{item.name}"
                  </h2>
                  <p className="text-static-text-600 dark:text-static-text-400 mb-6">
                    Assign quantities to each member. Total quantity: {item.quantity}.
                  </p>

                  <div className="space-y-3 mb-6">
                    {members.map((member) => {
                      const assignedQty = currentSplits[member.id] || 0;
                      return (
                        <div key={member.id} className="flex items-center justify-between p-3 bg-static-bg-100 dark:bg-gray-700 rounded-lg">
                          <p className="font-medium text-static-text-900 dark:text-static-text-50">{member.name}</p>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleSplitChange(splittingItemIndex, member.id, Math.max(0, assignedQty - 1))}
                              className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 text-lg font-bold text-static-text-700 dark:text-static-text-300 hover:bg-gray-300 dark:hover:bg-gray-500"
                            >
                              -
                            </button>
                            <span className="text-lg font-bold w-8 text-center text-static-text-900 dark:text-static-text-50">{assignedQty}</span>
                            <button
                              onClick={() => handleSplitChange(splittingItemIndex, member.id, assignedQty + 1)}
                              className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 text-lg font-bold text-static-text-700 dark:text-static-text-300 hover:bg-gray-300 dark:hover:bg-gray-500"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className={`p-4 rounded-lg mb-6 ${
                    remainingToAssign === 0
                      ? 'bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700'
                      : 'bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700'
                  }`}>
                    <p className="font-medium text-center text-static-text-900 dark:text-static-text-50">
                      {remainingToAssign} of {item.quantity} remaining to assign
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setSplittingItemIndex(null)}
                      className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-600 text-static-text-900 dark:text-static-text-50 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveSplit}
                      disabled={remainingToAssign !== 0}
                      className="flex-1 px-4 py-3 bg-static-bg-700 hover:bg-static-bg-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                    >
                      Save Split
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Tip Split Modal */}
      {showTipSplitModal && (
        <div
          className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowTipSplitModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-static-text-900 dark:text-static-text-50">
                How to Split Tip?
              </h3>
              <button
                onClick={() => setShowTipSplitModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-static-text-600 dark:text-static-text-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Proportional */}
              <label className="flex items-start gap-4 cursor-pointer p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-2 border-transparent">
                <input
                  type="radio"
                  name="tip-split-modal"
                  checked={tipSplitType === 'proportional'}
                  onChange={() => setTipSplitType('proportional')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="text-base font-semibold text-static-text-900 dark:text-static-text-50 mb-1">
                    Proportional (Recommended)
                  </div>
                  <div className="text-sm text-static-text-600 dark:text-static-text-400">
                    Each person pays tip based on their bill amount. Fair and automatic.
                  </div>
                </div>
              </label>

              {/* Equal */}
              <label className="flex items-start gap-4 cursor-pointer p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-2 border-transparent">
                <input
                  type="radio"
                  name="tip-split-modal"
                  checked={tipSplitType === 'equal'}
                  onChange={() => setTipSplitType('equal')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="text-base font-semibold text-static-text-900 dark:text-static-text-50 mb-1">
                    Split Equally
                  </div>
                  <div className="text-sm text-static-text-600 dark:text-static-text-400">
                    Everyone pays the same tip amount regardless of their bill.
                  </div>
                </div>
              </label>

              {/* Custom */}
              <label className="flex items-start gap-4 cursor-pointer p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-2 border-transparent">
                <input
                  type="radio"
                  name="tip-split-modal"
                  checked={tipSplitType === 'custom'}
                  onChange={() => setTipSplitType('custom')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="text-base font-semibold text-static-text-900 dark:text-static-text-50 mb-1">
                    Select Who Pays Tip
                  </div>
                  <div className="text-sm text-static-text-600 dark:text-static-text-400 mb-3">
                    Choose specific people to split the tip proportionally.
                  </div>

                  {/* Custom member selection */}
                  {tipSplitType === 'custom' && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                      <p className="text-xs font-medium text-static-text-700 dark:text-static-text-300 mb-2">
                        Select members:
                      </p>
                      {members.map((member) => (
                        <label key={member.id} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                          <input
                            type="checkbox"
                            checked={tipAssignedMembers.includes(member.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setTipAssignedMembers([...tipAssignedMembers, member.id]);
                              } else {
                                setTipAssignedMembers(tipAssignedMembers.filter(id => id !== member.id));
                              }
                            }}
                            className="w-4 h-4 rounded"
                          />
                          <span className="text-sm font-medium text-static-text-900 dark:text-static-text-50">
                            {member.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </label>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
              <button
                onClick={() => setShowTipSplitModal(false)}
                className="w-full px-4 py-2.5 bg-static-bg-700 hover:bg-static-bg-600 text-white rounded-lg font-medium transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Image Modal */}
      {viewingReceiptImageUrl && (
        <div
          className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setViewingReceiptImageUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            {/* Close button */}
            <button
              onClick={() => setViewingReceiptImageUrl(null)}
              className="absolute -top-12 right-0 p-2 text-white hover:text-gray-300 transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Receipt image */}
            <div 
              className="bg-white rounded-lg overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={viewingReceiptImageUrl}
                alt="Receipt"
                className="w-full h-auto max-h-[85vh] object-contain"
              />
              
              {/* Download button */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <p className="text-sm text-static-text-600 dark:text-static-text-400">
                  Click outside to close
                </p>
                <a
                  href={viewingReceiptImageUrl}
                  download="receipt.jpg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
