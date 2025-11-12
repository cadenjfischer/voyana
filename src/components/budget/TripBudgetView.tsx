'use client';

import { useState, useEffect, useRef, useLayoutEffect } from 'react';
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
  // Color palette for member avatars
  const getMemberColor = (memberId: string, members: GroupMember[]) => {
    const colors = [
      'from-blue-500 to-purple-600',
      'from-pink-500 to-rose-600',
      'from-green-500 to-emerald-600',
      'from-orange-500 to-amber-600',
      'from-cyan-500 to-teal-600',
      'from-violet-500 to-purple-600',
      'from-red-500 to-pink-600',
      'from-indigo-500 to-blue-600',
      'from-lime-500 to-green-600',
      'from-fuchsia-500 to-purple-600',
    ];
    const memberIndex = members.findIndex(m => m.id === memberId);
    return colors[memberIndex % colors.length];
  };

  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showPayerPanel, setShowPayerPanel] = useState(false);
  const [showSplitPanel, setShowSplitPanel] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'expenses' | 'balance' | 'settlements'>('expenses');
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null);
  const [showItemizedExpenseId, setShowItemizedExpenseId] = useState<string | null>(null);
  
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
  const [expenseSplitType, setExpenseSplitType] = useState<'equal' | 'percentage' | 'custom'>('equal');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([currentUserId]);
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});
  const [percentageSplits, setPercentageSplits] = useState<Record<string, string>>({});

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
  // itemAssignments: For items with quantity=1, array of { memberId, amount }
  // For items with quantity>1, this represents the "parent" level (not used for calculation, just for UI state)
  const [itemAssignments, setItemAssignments] = useState<Record<number, string[]>>({});
  const [splittingItemIndex, setSplittingItemIndex] = useState<number | null>(null);
  // itemSplits: For quantity items - structure: { itemIndex: { 0: ['memberId1', 'memberId2'], 1: ['memberId3'], ... } }
  // Each sub-item (0, 1, 2...) can have multiple members assigned (for shared expenses)
  const [itemSplits, setItemSplits] = useState<Record<number, Record<number, string[]>>>({});
  const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null);
  const [quickAssignMemberId, setQuickAssignMemberId] = useState<string | null>(null); // For quick assign mode
  const [openItemDropdownIndex, setOpenItemDropdownIndex] = useState<number | string | null>(null); // For item dropdown menus (can be number or "itemIndex-qtyIndex")
  const [expandedQtyItemIndex, setExpandedQtyItemIndex] = useState<number | null>(null); // For inline quantity split
  const [viewingReceiptImageUrl, setViewingReceiptImageUrl] = useState<string | null>(null);
  const [manualTip, setManualTip] = useState<string>(''); // For manual tip entry
  const [tipSplitType, setTipSplitType] = useState<'proportional' | 'equal' | 'custom'>('proportional'); // How to split tip
  const [tipAssignedMembers, setTipAssignedMembers] = useState<string[]>([]); // Members who pay tip (for custom)
  const [showTipSplitModal, setShowTipSplitModal] = useState(false); // Modal for tip split options
  const [showTipMemberSelectModal, setShowTipMemberSelectModal] = useState(false); // Modal for selecting who pays tip
  const [showTipInput, setShowTipInput] = useState(false); // Show/hide tip input bubble
  const [receiptSplitMode, setReceiptSplitMode] = useState<'itemized' | 'equal' | 'exact' | 'percentage'>('itemized'); // Split mode for receipt
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({}); // For exact amounts mode
  const [percentages, setPercentages] = useState<Record<string, string>>({}); // For percentage mode
  const [selectedSplitMembers, setSelectedSplitMembers] = useState<string[]>([]); // Members selected for non-itemized splits

  // Match side panel height to the left modal so it never grows taller
  const scanModalRef = useRef<HTMLDivElement | null>(null);
  const [sidePanelHeight, setSidePanelHeight] = useState<number | null>(null);
  useLayoutEffect(() => {
    if (!showScanReceiptModal) return;
    const measure = () => {
      const h = scanModalRef.current?.getBoundingClientRect().height;
      if (h && h !== sidePanelHeight) setSidePanelHeight(h);
    };
    measure();
    const ro = scanModalRef.current ? new ResizeObserver(measure) : null;
    if (ro && scanModalRef.current) ro.observe(scanModalRef.current);
    window.addEventListener('resize', measure);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [showScanReceiptModal, scannedReceipt, manualTip, showTipInput, openDropdownIndex]);

  // Lock body scroll when modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    if (showAddExpenseModal || showScanReceiptModal || splittingItemIndex !== null || showTipSplitModal || showTipMemberSelectModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = prev || '';
    }
    return () => {
      document.body.style.overflow = prev || '';
    };
  }, [showAddExpenseModal, showScanReceiptModal, splittingItemIndex, showTipSplitModal, showTipMemberSelectModal]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Check if click is outside item dropdown
      if (openItemDropdownIndex !== null && !target.closest('.item-dropdown-container')) {
        setOpenItemDropdownIndex(null);
      }
      
      // Determine click regions
      const clickedInSidePanel = !!target.closest('.assign-items-side-panel');
      const clickedInMainModal = scanModalRef.current?.contains(target) ?? false; // the entire left Scan Receipt modal

      // If clicking inside the side panel OR inside the main modal, do not auto-close the right panel.
      if (clickedInSidePanel || clickedInMainModal) {
        return;
      }

      // Otherwise, close the right panel (e.g., clicking on the dark overlay/background)
      if (openDropdownIndex !== null) {
        setOpenDropdownIndex(null);
      }
    };

    if (openDropdownIndex !== null || openItemDropdownIndex !== null) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openDropdownIndex, openItemDropdownIndex]);

  // Initialize budget data from trip if not exists
  const expenses: Expense[] = (trip as any).expenses || [];
  let members: GroupMember[] = (trip as any).budgetMembers || [
    {
      id: currentUserId,
      name: currentUserEmail.split('@')[0],
      email: currentUserEmail,
      role: 'owner' as const,
      joinedAt: new Date().toISOString(),
    }
  ];

  // TEMP FIX: If expenses have member IDs that aren't in the members list, add them as unknown
  // This prevents "Unknown" from showing up for valid member IDs
  const allMemberIds = new Set(members.map(m => m.id));
  expenses.forEach(expense => {
    expense.shares?.forEach(share => {
      const memberId = typeof share.memberId === 'string' ? share.memberId : String(share.memberId);
      if (!allMemberIds.has(memberId)) {
        members.push({
          id: memberId,
          name: memberId.substring(0, 8), // Use first 8 chars of ID as name
          role: 'member' as const,
          joinedAt: new Date().toISOString(),
        });
        allMemberIds.add(memberId);
      }
    });
  });

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

    // Calculate base total and actual total
    const itemsTotal = scannedReceipt.items.reduce((sum, item) => 
      sum + (item.price * (item.quantity || 1)), 0
    );
    const baseTotal = scannedReceipt.total || 
      (scannedReceipt.subtotal && scannedReceipt.tax 
        ? scannedReceipt.subtotal + scannedReceipt.tax 
        : itemsTotal);
    const tipAmount = manualTip && parseFloat(manualTip) > 0 ? parseFloat(manualTip) : 0;
    // We'll build member totals WITHOUT tip first, then apply tip distribution according to tipSplitType.
    const memberTotals: Record<string, number> = {}; // base (pre-tip) amounts per member
    const allParticipants = new Set<string>();

    if (receiptSplitMode === 'equal') {
      // SPLIT EVENLY MODE (base only)
      if (selectedSplitMembers.length === 0) {
        alert('Please select at least one person to split with');
        return;
      }
      const basePerPerson = baseTotal / selectedSplitMembers.length;
      selectedSplitMembers.forEach(memberId => {
        allParticipants.add(memberId);
        memberTotals[memberId] = basePerPerson;
      });

    } else if (receiptSplitMode === 'exact') {
      // EXACT AMOUNTS MODE - user provides amounts for the BASE (excluding tip)
      const allocatedBase = Object.entries(exactAmounts).reduce((sum, [memberId, amount]) => {
        const amt = parseFloat(amount) || 0;
        if (amt > 0) {
          allParticipants.add(memberId);
          memberTotals[memberId] = amt;
          return sum + amt;
        }
        return sum;
      }, 0);

      if (Math.abs(allocatedBase - baseTotal) > 0.01) {
        alert(`Allocated amounts must equal the base total ${formatCurrency(baseTotal, currency)} (tip is added separately).`);
        return;
      }

    } else if (receiptSplitMode === 'percentage') {
      // PERCENTAGE MODE - percentages apply to the BASE
      const totalPercent = Object.values(percentages).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
      if (Math.abs(totalPercent - 100) > 0.01) {
        alert('Percentages must add up to 100%');
        return;
      }

      Object.entries(percentages).forEach(([memberId, percent]) => {
        const pct = parseFloat(percent) || 0;
        if (pct > 0) {
          const baseShare = (pct / 100) * baseTotal;
          allParticipants.add(memberId);
          memberTotals[memberId] = baseShare;
        }
      });

    } else {
      // ITEMIZED MODE (original logic)
      const finalAssignments = { ...itemAssignments };
      scannedReceipt.items.forEach((_, index) => {
        if (!finalAssignments[index] || finalAssignments[index].length === 0) {
          finalAssignments[index] = [expensePaidBy];
        }
      });

      const baseDifference = baseTotal - itemsTotal;

      // Process items, including quantity splits
      scannedReceipt.items.forEach((item, index) => {
        const itemTotal = item.price * (item.quantity || 1);
        const splits = itemSplits[index];

        if (splits && Object.keys(splits).length > 0 && item.quantity && item.quantity > 1) {
          // Item was split by quantity - process each sub-item
          for (let qtyIndex = 0; qtyIndex < item.quantity; qtyIndex++) {
            const assignedMembers = splits[qtyIndex] || [];
            
            if (assignedMembers.length > 0) {
              const perPerson = item.price / assignedMembers.length;
              assignedMembers.forEach(memberId => {
                allParticipants.add(memberId);
                memberTotals[memberId] = (memberTotals[memberId] || 0) + perPerson;
              });
            } else {
              allParticipants.add(expensePaidBy);
              memberTotals[expensePaidBy] = (memberTotals[expensePaidBy] || 0) + item.price;
            }
          }
        } else {
          const assignedMembers = finalAssignments[index];
          if (assignedMembers && assignedMembers.length > 0) {
            const perPerson = itemTotal / assignedMembers.length;
            assignedMembers.forEach(assignment => {
              // Handle both string IDs and assignment objects
              const memberId = typeof assignment === 'string' ? assignment : assignment?.memberId;
              if (memberId) {
                allParticipants.add(memberId);
                memberTotals[memberId] = (memberTotals[memberId] || 0) + perPerson;
              }
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

      // Tip distribution for itemized handled below (shared logic)
    }

    // Apply tip distribution (all modes) AFTER base shares computed
    if (tipAmount > 0) {
      // Determine who pays the tip
      let tipPayers: string[];
      if (tipSplitType === 'custom') {
        tipPayers = tipAssignedMembers.length > 0 ? tipAssignedMembers : Array.from(allParticipants);
      } else {
        tipPayers = Array.from(allParticipants);
      }

      // Ensure tip payers are part of participants set
      tipPayers.forEach(id => allParticipants.add(id));

      // Sum of base amounts for proportional split among tip payers
      const baseTotalForTip = tipPayers.reduce((sum, id) => sum + (memberTotals[id] || 0), 0);

      if (tipSplitType === 'equal') {
        const perPersonTip = tipAmount / tipPayers.length;
        tipPayers.forEach(id => {
          memberTotals[id] = (memberTotals[id] || 0) + perPersonTip;
        });
      } else {
        // proportional or custom (proportional among selected)
        if (baseTotalForTip > 0.01) {
          tipPayers.forEach(id => {
            const proportion = (memberTotals[id] || 0) / baseTotalForTip;
            memberTotals[id] = (memberTotals[id] || 0) + (tipAmount * proportion);
          });
        } else {
          // Fall back to equal if all zero
            const fallbackTip = tipAmount / tipPayers.length;
            tipPayers.forEach(id => {
              memberTotals[id] = (memberTotals[id] || 0) + fallbackTip;
            });
        }
      }
    }

    const actualTotal = baseTotal + tipAmount; // recompute after distribution logic (for percentage display)

    // Calculate per-person breakdown of items, tax, and tip
    const memberBreakdowns: Record<string, { items: number; tax: number; tip: number; total: number }> = {};
    const itemsSubtotal = scannedReceipt.subtotal || scannedReceipt.items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    const taxAmount = scannedReceipt.tax || 0;
    
    Array.from(allParticipants).forEach(memberId => {
      const totalForMember = memberTotals[memberId];
      
      // Calculate proportion of member's total to actualTotal to determine their tax/tip share
      const memberProportion = actualTotal > 0 ? totalForMember / actualTotal : 0;
      
      // Tax and tip are distributed proportionally based on the member's share
      const memberTax = taxAmount * memberProportion;
      const memberTip = tipAmount * memberProportion;
      
      // Items amount is total minus tax and tip
      const memberItems = totalForMember - memberTax - memberTip;
      
      memberBreakdowns[memberId] = {
        items: memberItems,
        tax: memberTax,
        tip: memberTip,
        total: totalForMember
      };
    });

    // Create shares
    const shares: ExpenseShare[] = Array.from(allParticipants).map(memberId => ({
      memberId,
      amount: memberTotals[memberId],
      percentage: actualTotal > 0.01 ? (memberTotals[memberId] / actualTotal) * 100 : 0,
    }));

    // Simple description - just "Receipt" (expandable dropdown can show details later)
    const description = 'Receipt';

    // Store receipt details as metadata (we'll add this to the expense)
    const receiptDetails = {
      items: receiptSplitMode === 'itemized' ? scannedReceipt.items.map((item, index) => {
        const assignments = itemAssignments[index] || [];
        // Extract member IDs from assignments (handle both string IDs and objects)
        const assignedTo = assignments.map((a: any) => 
          typeof a === 'string' ? a : a?.memberId
        ).filter(Boolean);
        
        return {
          ...item,
          assignedTo,
          splits: itemSplits[index] || {}, // Store the detailed splits
        };
      }) : scannedReceipt.items,
      subtotal: scannedReceipt.subtotal,
      tax: scannedReceipt.tax,
      tip: tipAmount, // Only store manual tip (OCR tips are ignored)
      total: actualTotal,
      splitMode: receiptSplitMode, // Store which split mode was used
      memberBreakdowns, // Store per-person breakdown of items/tax/tip
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
    setReceiptSplitMode('itemized'); // Reset to itemized mode
    setExactAmounts({}); // Reset exact amounts
    setPercentages({}); // Reset percentages
    setSelectedSplitMembers([]); // Reset selected members
  };

  // Helper: Toggle member assignment for a specific quantity sub-item
  const toggleMemberForSubItem = (itemIndex: number, qtyIndex: number, memberId: string) => {
    setItemSplits(prev => {
      const itemSplit = prev[itemIndex] || {};
      const subItemAssignments = itemSplit[qtyIndex] || [];
      
      const isAssigned = subItemAssignments.includes(memberId);
      
      return {
        ...prev,
        [itemIndex]: {
          ...itemSplit,
          [qtyIndex]: isAssigned
            ? subItemAssignments.filter(id => id !== memberId)
            : [...subItemAssignments, memberId]
        }
      };
    });
  };

  // Helper: Assign a member to ALL sub-items of a quantity item (parent-level assignment)
  const assignMemberToAllSubItems = (itemIndex: number, memberId: string, quantity: number) => {
    setItemSplits(prev => {
      const itemSplit = prev[itemIndex] || {};
      const newItemSplit: Record<number, string[]> = {};
      
      // For each quantity sub-item, add this member if not already present
      for (let i = 0; i < quantity; i++) {
        const currentAssignments = itemSplit[i] || [];
        if (!currentAssignments.includes(memberId)) {
          newItemSplit[i] = [...currentAssignments, memberId];
        } else {
          newItemSplit[i] = currentAssignments;
        }
      }
      
      return {
        ...prev,
        [itemIndex]: newItemSplit
      };
    });
  };

  // Helper: Remove a member from ALL sub-items (parent-level unassignment)
  const removeMemberFromAllSubItems = (itemIndex: number, memberId: string, quantity: number) => {
    setItemSplits(prev => {
      const itemSplit = prev[itemIndex] || {};
      const newItemSplit: Record<number, string[]> = {};
      
      // For each quantity sub-item, remove this member
      for (let i = 0; i < quantity; i++) {
        const currentAssignments = itemSplit[i] || [];
        newItemSplit[i] = currentAssignments.filter(id => id !== memberId);
      }
      
      return {
        ...prev,
        [itemIndex]: newItemSplit
      };
    });
  };

  // Helper: Check if a member is assigned to ALL sub-items (for parent checkbox state)
  const isMemberAssignedToAllSubItems = (itemIndex: number, memberId: string, quantity: number): boolean => {
    const itemSplit = itemSplits[itemIndex] || {};
    for (let i = 0; i < quantity; i++) {
      const subItemAssignments = itemSplit[i] || [];
      if (!subItemAssignments.includes(memberId)) {
        return false;
      }
    }
    return true;
  };

  // Helper: Check if a member is assigned to SOME (but not all) sub-items
  const isMemberAssignedToSomeSubItems = (itemIndex: number, memberId: string, quantity: number): boolean => {
    const itemSplit = itemSplits[itemIndex] || {};
    let hasAny = false;
    let hasAll = true;
    
    for (let i = 0; i < quantity; i++) {
      const subItemAssignments = itemSplit[i] || [];
      if (subItemAssignments.includes(memberId)) {
        hasAny = true;
      } else {
        hasAll = false;
      }
    }
    
    return hasAny && !hasAll;
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
    } else if (expenseSplitType === 'percentage') {
      // Percentage split
      shares = members.map(member => {
        const percentage = parseFloat(percentageSplits[member.id]) || 0;
        return {
          memberId: member.id,
          amount: (totalAmount * percentage) / 100,
          percentage,
        };
      }).filter(share => share.percentage > 0);
    } else {
      // Custom split
      const totalAllocated = Object.entries(customSplits)
        .reduce((sum, [, val]) => sum + (parseFloat(val) || 0), 0);

      if (Math.abs(totalAllocated - totalAmount) > 0.01) {
        alert(`Split amounts must equal ${formatCurrency(totalAmount, currency)}`);
        return;
      }

      shares = Object.entries(customSplits)
        .filter(([, val]) => parseFloat(val) > 0)
        .map(([memberId, val]) => {
          const amount = parseFloat(val);
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
      splitType: expenseSplitType === 'equal' ? 'equal' : expenseSplitType === 'percentage' ? 'percentage' : 'custom',
      shares,
      participants: shares.map(s => s.memberId),
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
                                
                                {/* Per-person totals - shown by default */}
                                {expense.shares && expense.shares.length > 0 && (
                                  <div className="mb-3">
                                    <div className="text-xs font-semibold text-static-text-700 dark:text-static-text-300 px-2 mb-2">
                                      Individual Totals:
                                    </div>
                                    <div>
                                      {expense.shares.map((share, shareIdx) => {
                                        const member = members.find(m => m.id === share.memberId);
                                        const breakdown = expenseWithReceipt.receiptDetails?.memberBreakdowns?.[share.memberId];
                                        
                                        // Debug: Check if breakdown exists
                                        console.log('🔍 Breakdown check:', {
                                          memberId: share.memberId,
                                          memberName: member?.name,
                                          hasBreakdown: !!breakdown,
                                          breakdown: breakdown,
                                          hasReceiptDetails: !!expenseWithReceipt.receiptDetails,
                                          hasMemberBreakdowns: !!expenseWithReceipt.receiptDetails?.memberBreakdowns
                                        });
                                        
                                        // Debug: log what we're looking for
                                        if (!member) {
                                          console.log('❌ Cannot find member:', {
                                            lookingFor: share.memberId,
                                            availableMembers: members.map(m => ({ id: m.id, name: m.name }))
                                          });
                                        }
                                        
                                        return (
                                          <div key={`${expense.id}-share-${shareIdx}`} className="py-2 px-3 mb-1 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800/70 transition-colors">
                                            <div className="flex justify-between items-center">
                                              <span className="text-xs font-medium text-static-text-800 dark:text-static-text-200">
                                                {member?.name || `Unknown (${share.memberId})`}
                                              </span>
                                              <span className="text-xs font-bold text-static-text-900 dark:text-static-text-50 tabular-nums">
                                                {formatCurrency(share.amount, currency)}
                                              </span>
                                            </div>
                                            {breakdown && (breakdown.tax > 0 || breakdown.tip > 0) && (
                                              <div className="mt-1 text-[10px] text-static-text-500 dark:text-static-text-400 flex gap-3">
                                                <span className="tabular-nums">Items: {formatCurrency(breakdown.items, currency)}</span>
                                                {breakdown.tax > 0 && (
                                                  <span className="tabular-nums">Tax: {formatCurrency(breakdown.tax, currency)}</span>
                                                )}
                                                {breakdown.tip > 0 && (
                                                  <span className="tabular-nums">Tip: {formatCurrency(breakdown.tip, currency)}</span>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Button to show itemized breakdown */}
                                <button
                                  onClick={() => setShowItemizedExpenseId(showItemizedExpenseId === expense.id ? null : expense.id)}
                                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors text-sm"
                                >
                                  <svg className="w-4 h-4 text-static-text-600 dark:text-static-text-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                  </svg>
                                  <span className="font-medium text-static-text-700 dark:text-static-text-300">
                                    View itemized breakdown
                                  </span>
                                </button>
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
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 p-4"
          onClick={() => {
            resetExpenseForm();
            setShowAddExpenseModal(false);
          }}
        >
          <div 
            className="flex items-start gap-4 w-full justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Main Modal */}
            <div 
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col"
            >
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-static-text-900 dark:text-static-text-50">
                Add an expense
              </h2>
              <button
                onClick={() => {
                  resetExpenseForm();
                  setEditingExpenseId(null);
                  setShowAddExpenseModal(false);
                }}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-static-text-600 dark:text-static-text-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-5 space-y-3">
                {/* Description with icon */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg mt-0.5">
                    <svg className="w-5 h-5 text-static-text-600 dark:text-static-text-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={expenseDescription}
                      onChange={(e) => setExpenseDescription(e.target.value)}
                      placeholder="Enter a description"
                      className="w-full px-0 py-1 bg-transparent border-0 border-b border-gray-300 dark:border-gray-600 text-static-text-900 dark:text-static-text-50 placeholder:text-static-text-400 focus:outline-none focus:border-static-accent-500 transition-colors text-base"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Amount - Large centered */}
                <div className="py-2">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-3xl font-light text-static-text-500">
                      {currency}
                    </span>
                    <input
                      type="number"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="w-32 bg-transparent text-static-text-900 dark:text-static-text-50 placeholder:text-static-text-400 focus:outline-none text-4xl font-light text-center"
                    />
                  </div>
                </div>

                {/* Paid by and split - Button style */}
                <div className="space-y-2">
                  {/* Paid by button */}
                  <div>
                    <label className="block text-xs font-medium text-static-text-600 dark:text-static-text-400 mb-1.5">
                      Paid by
                    </label>
                    <button
                      onClick={() => {
                        setShowSplitPanel(false);
                        setShowPayerPanel(true);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:border-static-bg-700 dark:hover:border-static-bg-700 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all text-left"
                    >
                      <span className="text-sm text-static-text-900 dark:text-static-text-50 font-medium">
                        {expensePaidBy ? members.find(m => m.id === expensePaidBy)?.name || 'Select member' : 'Select member'}
                      </span>
                      <svg className="w-4 h-4 text-static-text-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {/* Split between button */}
                  <div>
                    <label className="block text-xs font-medium text-static-text-600 dark:text-static-text-400 mb-1.5">
                      Split between
                    </label>
                    <button
                      onClick={() => {
                        setShowPayerPanel(false);
                        setShowSplitPanel(true);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:border-static-bg-700 dark:hover:border-static-bg-700 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all text-left"
                    >
                      <span className="text-sm text-static-text-900 dark:text-static-text-50 font-medium">
                        {expenseSplitType === 'equal' 
                          ? `${selectedMembers.length} ${selectedMembers.length === 1 ? 'person' : 'people'} equally`
                          : expenseSplitType === 'percentage'
                          ? `${Object.keys(percentageSplits).filter(id => percentageSplits[id] && parseFloat(percentageSplits[id]) > 0).length} ${Object.keys(percentageSplits).filter(id => percentageSplits[id] && parseFloat(percentageSplits[id]) > 0).length === 1 ? 'person' : 'people'} by percentage`
                          : 'Custom amounts'}
                      </span>
                      <svg className="w-4 h-4 text-static-text-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

                {/* Compact fields */}
                <div className="space-y-2">
                  {/* Date */}
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                  >
                    <span className="text-sm text-static-text-900 dark:text-static-text-50">
                      {new Date(expenseDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                  </button>

                  {/* Category */}
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    className={`w-full px-3 py-2 bg-transparent rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none transition-colors appearance-none cursor-pointer text-sm ${
                      expenseCategory ? 'text-static-text-900 dark:text-static-text-50' : 'text-static-text-500'
                    }`}
                    style={{ 
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                      backgroundPosition: 'right 0.75rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1rem'
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
              </div>
            </div>

            {/* Footer Button */}
            <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    resetExpenseForm();
                    setShowAddExpenseModal(false);
                  }}
                  className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-static-text-900 dark:text-static-text-50 rounded-lg font-medium transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddExpense}
                  disabled={
                    !expenseDescription.trim() || 
                    !expenseAmount || 
                    parseFloat(expenseAmount) <= 0 || 
                    !expensePaidBy || 
                    (expenseSplitType === 'equal' && selectedMembers.length === 0) ||
                    (expenseSplitType === 'percentage' && (() => {
                      const totalPercentage = Object.values(percentageSplits).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
                      return totalPercentage === 0;
                    })()) ||
                    (expenseSplitType === 'custom' && (() => {
                      const total = Object.values(customSplits).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
                      return Math.abs(total - (parseFloat(expenseAmount) || 0)) > 0.01;
                    })())
                  }
                  className="flex-1 px-4 py-2.5 bg-static-bg-700 hover:bg-static-bg-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed text-sm"
                >
                  Save
                </button>
              </div>
            </div>
          </div>

            {/* Payer Selection Side Panel */}
            {showPayerPanel && (
              <div 
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm max-h-[90vh] flex flex-col"
              >
                {/* Header */}
                <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-bold text-static-text-900 dark:text-static-text-50">
                    Choose payer
                  </h3>
                  <button
                    onClick={() => setShowPayerPanel(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-static-text-600 dark:text-static-text-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-2">
                    {members.map((member) => {
                      const isSelected = expensePaidBy === member.id;
                      return (
                        <button
                          key={member.id}
                          onClick={() => {
                            setExpensePaidBy(member.id);
                            setShowPayerPanel(false);
                          }}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                            isSelected
                              ? 'border-static-bg-700 bg-static-bg-700/10 dark:bg-static-bg-700/20'
                              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                            {member.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <span className="flex-1 text-left font-medium text-static-text-900 dark:text-static-text-50">
                            {member.name}
                            {member.id === currentUserId && (
                              <span className="ml-2 text-sm text-static-text-500">(You)</span>
                            )}
                          </span>
                          {isSelected && (
                            <svg className="w-5 h-5 text-static-bg-700 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                    
                    {/* Multiple people option */}
                    <button
                      className="w-full flex items-center gap-3 p-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-all"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                        </svg>
                      </div>
                      <span className="flex-1 text-left font-medium text-static-text-900 dark:text-static-text-50">
                        Multiple people
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Split Options Side Panel */}
            {showSplitPanel && (
              <div 
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm max-h-[90vh] flex flex-col"
              >
                {/* Header */}
                <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-bold text-static-text-900 dark:text-static-text-50">
                    Choose split options
                  </h3>
                  <button
                    onClick={() => setShowSplitPanel(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-static-text-600 dark:text-static-text-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Toolbar with split type options */}
                <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setExpenseSplitType('equal')}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                        expenseSplitType === 'equal'
                          ? 'bg-static-bg-700 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-static-text-700 dark:text-static-text-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      Equally
                    </button>
                    <button 
                      onClick={() => setExpenseSplitType('percentage')}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                        expenseSplitType === 'percentage'
                          ? 'bg-static-bg-700 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-static-text-700 dark:text-static-text-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      Percentage
                    </button>
                    <button 
                      onClick={() => setExpenseSplitType('custom')}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                        expenseSplitType === 'custom'
                          ? 'bg-static-bg-700 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-static-text-700 dark:text-static-text-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      Custom
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  <h4 className="text-sm font-semibold text-static-text-900 dark:text-static-text-50 mb-3">
                    {expenseSplitType === 'equal' ? 'Split equally' : expenseSplitType === 'percentage' ? 'Split by percentage' : 'Custom amounts'}
                  </h4>
                  
                  {expenseSplitType === 'equal' ? (
                    /* Equal Split - Member Selection */
                    <div className="space-y-2">
                      {members.map((member) => {
                        const isSelected = selectedMembers.includes(member.id);
                        return (
                          <button
                            key={member.id}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedMembers(selectedMembers.filter(id => id !== member.id));
                              } else {
                                setSelectedMembers([...selectedMembers, member.id]);
                              }
                            }}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                              isSelected
                                ? 'border-static-bg-700 bg-static-bg-700/10 dark:bg-static-bg-700/20'
                                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                            }`}
                          >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                              {member.name?.[0]?.toUpperCase() || '?'}
                            </div>
                            <span className="flex-1 text-left font-medium text-static-text-900 dark:text-static-text-50">
                              {member.name}
                              {member.id === currentUserId && (
                                <span className="ml-2 text-sm text-static-text-500">(You)</span>
                              )}
                            </span>
                            <span className="text-sm text-static-text-600 dark:text-static-text-400">
                              {formatCurrency(parseFloat(expenseAmount || '0') / Math.max(1, selectedMembers.length), currency)}
                            </span>
                            {isSelected && (
                              <svg className="w-5 h-5 text-static-bg-700 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : expenseSplitType === 'percentage' ? (
                    /* Percentage Split - Percentage Inputs */
                    <div className="space-y-3">
                      {members.map((member, index) => {
                        // Calculate auto-percentage for last member
                        const isLastMember = index === members.length - 1;
                        const otherMembersTotal = members
                          .filter((_, i) => i !== index)
                          .reduce((sum, m) => sum + (parseFloat(percentageSplits[m.id]) || 0), 0);
                        const autoPercentage = isLastMember && otherMembersTotal < 100 
                          ? Math.max(0, 100 - otherMembersTotal)
                          : undefined;
                        
                        const displayValue = autoPercentage !== undefined 
                          ? autoPercentage.toFixed(0)
                          : percentageSplits[member.id] || '';

                        return (
                          <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                              {member.name?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-static-text-900 dark:text-static-text-50 text-sm truncate">
                                {member.name}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-600">
                              <input
                                type="number"
                                value={displayValue}
                                onChange={(e) => {
                                  const newValue = e.target.value;
                                  const newPercentage = parseFloat(newValue) || 0;
                                  
                                  if (newPercentage <= 100) {
                                    const newSplits = {
                                      ...percentageSplits,
                                      [member.id]: newValue
                                    };
                                    
                                    // Auto-calculate last member
                                    if (!isLastMember) {
                                      const totalOthers = members
                                        .filter((_, i) => i !== index && i !== members.length - 1)
                                        .reduce((sum, m) => sum + (parseFloat(newSplits[m.id]) || 0), 0);
                                      const remaining = 100 - newPercentage - totalOthers;
                                      if (remaining >= 0) {
                                        const lastMember = members[members.length - 1];
                                        newSplits[lastMember.id] = remaining.toString();
                                      }
                                    }
                                    
                                    setPercentageSplits(newSplits);
                                  }
                                }}
                                disabled={isLastMember && otherMembersTotal < 100}
                                placeholder="0"
                                step="1"
                                min="0"
                                max="100"
                                className="w-16 bg-transparent text-static-text-900 dark:text-static-text-50 focus:outline-none text-sm disabled:opacity-50"
                              />
                              <span className="text-xs text-static-text-500">%</span>
                            </div>
                          </div>
                        );
                      })}

                      {/* Info Message */}
                      <p className="text-xs text-center text-static-text-500 dark:text-static-text-400 mt-2">
                        Last person auto-fills to 100%
                      </p>
                    </div>
                  ) : (
                    /* Custom Split - Amount Inputs */
                    <div className="space-y-3">
                      {members.map((member, index) => {
                        // Calculate auto-amount for last member
                        const isLastMember = index === members.length - 1;
                        const totalExpense = parseFloat(expenseAmount) || 0;
                        const otherMembersTotal = members
                          .filter((_, i) => i !== index)
                          .reduce((sum, m) => sum + (parseFloat(customSplits[m.id]) || 0), 0);
                        const autoAmount = isLastMember && otherMembersTotal < totalExpense 
                          ? Math.max(0, totalExpense - otherMembersTotal)
                          : undefined;
                        
                        const displayValue = autoAmount !== undefined 
                          ? autoAmount.toFixed(2)
                          : customSplits[member.id] || '';

                        return (
                          <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                              {member.name?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-static-text-900 dark:text-static-text-50 text-sm truncate">
                                {member.name}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-600">
                              <span className="text-xs text-static-text-500">{currency}</span>
                              <input
                                type="number"
                                value={displayValue}
                                onChange={(e) => {
                                  const newValue = e.target.value;
                                  const newAmount = parseFloat(newValue) || 0;
                                  
                                  if (newAmount <= totalExpense) {
                                    const newSplits = {
                                      ...customSplits,
                                      [member.id]: newValue
                                    };
                                    
                                    // Auto-calculate last member
                                    if (!isLastMember) {
                                      const totalOthers = members
                                        .filter((_, i) => i !== index && i !== members.length - 1)
                                        .reduce((sum, m) => sum + (parseFloat(newSplits[m.id]) || 0), 0);
                                      const remaining = totalExpense - newAmount - totalOthers;
                                      if (remaining >= 0) {
                                        const lastMember = members[members.length - 1];
                                        newSplits[lastMember.id] = remaining.toFixed(2);
                                      }
                                    }
                                    
                                    setCustomSplits(newSplits);
                                  }
                                }}
                                disabled={isLastMember && otherMembersTotal < totalExpense}
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                className="w-20 bg-transparent text-static-text-900 dark:text-static-text-50 focus:outline-none text-sm disabled:opacity-50"
                              />
                            </div>
                          </div>
                        );
                      })}

                      {/* Info Message */}
                      <p className="text-xs text-center text-static-text-500 dark:text-static-text-400 mt-2">
                        Last person auto-fills to match total
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-4">
                  <button
                    onClick={() => setShowSplitPanel(false)}
                    className="w-full px-4 py-3 bg-static-bg-700 hover:bg-static-bg-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
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
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 p-4"
          onClick={resetScanReceiptModal}
        >
          <div 
            className="flex items-start gap-4 w-full justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Main Modal */}
            <div 
              ref={scanModalRef}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl flex flex-col min-w-0 w-full max-w-2xl max-h-[90vh]"
            >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-static-text-900 dark:text-static-text-50">
                Scan Receipt
              </h2>
              <p className="text-static-text-600 dark:text-static-text-400 mt-1">
                Upload a photo of your receipt to split items automatically
              </p>
              
              {/* Split Mode Selector - Only show after receipt is scanned */}
              {scannedReceipt && (
                <div className="mt-4"
                  onMouseDown={(e) => {
                    // Prevent the global outside-click (mousedown) handler from closing the right panel
                    // when switching between split methods while the panel is open.
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <label className="block text-sm font-medium text-static-text-700 dark:text-static-text-300 mb-2">
                    Split method
                  </label>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    <button
                      onClick={() => setReceiptSplitMode('itemized')}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                        receiptSplitMode === 'itemized'
                          ? 'bg-static-bg-700 text-white shadow-md'
                          : 'bg-gray-100 dark:bg-gray-700 text-static-text-700 dark:text-static-text-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                      Itemized
                    </button>
                    <button
                      onClick={() => setReceiptSplitMode('equal')}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                        receiptSplitMode === 'equal'
                          ? 'bg-static-bg-700 text-white shadow-md'
                          : 'bg-gray-100 dark:bg-gray-700 text-static-text-700 dark:text-static-text-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Split Evenly
                    </button>
                    <button
                      onClick={() => setReceiptSplitMode('exact')}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                        receiptSplitMode === 'exact'
                          ? 'bg-static-bg-700 text-white shadow-md'
                          : 'bg-gray-100 dark:bg-gray-700 text-static-text-700 dark:text-static-text-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      Exact Amounts
                    </button>
                    <button
                      onClick={() => setReceiptSplitMode('percentage')}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                        receiptSplitMode === 'percentage'
                          ? 'bg-static-bg-700 text-white shadow-md'
                          : 'bg-gray-100 dark:bg-gray-700 text-static-text-700 dark:text-static-text-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      Percentage
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 overflow-y-auto p-6">
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

                          {/* Manual Tip Input - iOS Toggle Style */}
                          <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
                            {!manualTip ? (
                              // Show toggle slider with inline input
                              <div className="flex items-center gap-2.5">
                                {/* iOS-style Toggle - Compact */}
                                <button
                                  type="button"
                                  onClick={() => setShowTipInput(!showTipInput)}
                                  className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-static-bg-700 focus:ring-offset-1 ${
                                    showTipInput
                                      ? 'bg-static-bg-700'
                                      : 'bg-gray-300 dark:bg-gray-600'
                                  }`}
                                  role="switch"
                                  aria-checked={showTipInput}
                                >
                                  <span
                                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                      showTipInput ? 'translate-x-4' : 'translate-x-0'
                                    }`}
                                  />
                                </button>

                                {/* Label */}
                                <span className="text-sm font-medium text-static-text-900 dark:text-static-text-50">
                                  Add Tip (Optional)
                                </span>

                                {/* Inline Input - appears when toggle is on */}
                                {showTipInput && (
                                  <div className="flex gap-2 flex-1 animate-in fade-in slide-in-from-left-2 duration-200">
                                    <div className="relative flex-1">
                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white text-sm font-medium">
                                        {currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£'}
                                      </span>
                                      <input
                                        type="number"
                                        id="tip-input-inline"
                                        placeholder="0.00"
                                        step="0.01"
                                        min="0"
                                        autoFocus
                                        className="w-full pl-8 pr-3 py-2 bg-transparent border border-white rounded-lg text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white transition-all"
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
                                        const input = document.getElementById('tip-input-inline') as HTMLInputElement;
                                        if (input.value && parseFloat(input.value) > 0) {
                                          setManualTip(input.value);
                                          setShowTipInput(false);
                                        }
                                      }}
                                      className="px-4 py-2 bg-static-bg-700 hover:bg-static-bg-600 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                                    >
                                      Add
                                    </button>
                                  </div>
                                )}
                              </div>
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

                  {/* Splitwise-style side-by-side layout */}
                  <div className="flex gap-4">
                    {/* Left side - Compact buttons */}
                    <div className="flex-1 space-y-3 min-w-0 member-dropdown-container">
                      {/* Paid by button */}
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          // Prevent the document-level mousedown handler from firing first
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // Use functional update to avoid stale state/race with outside click handler
                          setOpenDropdownIndex(prev => (prev === -1 ? null : -1));
                        }}
                        className={`w-full px-4 py-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                          openDropdownIndex === -1
                            ? 'border-static-bg-700 bg-static-bg-700/10'
                            : expensePaidBy
                            ? 'border-static-bg-700 bg-static-bg-700/5 hover:bg-static-bg-700/10'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                        }`}
                      >
                        <svg className="w-5 h-5 text-static-text-600 dark:text-static-text-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <div className="text-left min-w-0 flex-1">
                          <div className="text-xs text-static-text-500 dark:text-static-text-400">Paid by</div>
                          <div className="font-medium text-static-text-900 dark:text-static-text-50 truncate">
                            {expensePaidBy 
                              ? members.find(m => m.id === expensePaidBy)?.name 
                              : 'Choose who paid'
                            }
                          </div>
                        </div>
                        <svg 
                          className={`w-5 h-5 text-static-text-400 flex-shrink-0 transition-transform ${openDropdownIndex === -1 ? 'rotate-180' : ''}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>

                      {/* Split button */}
                      <button
                        type="button"
                        onMouseDown={(e) => {
                          // Prevent the document-level mousedown handler from firing first
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // Use functional update to avoid stale state/race with outside click handler
                          setOpenDropdownIndex(prev => (prev === -2 ? null : -2));
                        }}
                        className={`w-full px-4 py-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                          openDropdownIndex === -2
                            ? 'border-static-bg-700 bg-static-bg-700/10'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                        }`}
                      >
                        <svg className="w-5 h-5 text-static-text-600 dark:text-static-text-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <div className="text-left min-w-0 flex-1">
                          <div className="text-xs text-static-text-500 dark:text-static-text-400">Split</div>
                          <div className="font-medium text-static-text-900 dark:text-static-text-50 truncate">
                            {receiptSplitMode === 'itemized' ? (() => {
                              const assignedCount = scannedReceipt.items.filter((item, i) => {
                                const qty = item.quantity || 1;
                                if (qty === 1) {
                                  // Simple item: check itemAssignments
                                  return itemAssignments[i]?.length > 0;
                                } else {
                                  // Quantity item: check if ALL sub-items in itemSplits are assigned
                                  const splits = itemSplits[i];
                                  if (!splits) return false;
                                  for (let q = 0; q < qty; q++) {
                                    if (!splits[q] || splits[q].length === 0) return false;
                                  }
                                  return true;
                                }
                              }).length;
                              const totalCount = scannedReceipt.items.length;
                              if (assignedCount === 0) return 'Assign items';
                              if (assignedCount === totalCount) return `All ${totalCount} assigned`;
                              return `${assignedCount}/${totalCount} assigned`;
                            })() : receiptSplitMode === 'equal' ? (
                              selectedSplitMembers.length === 0 ? 'Select people' : `${selectedSplitMembers.length} people selected`
                            ) : receiptSplitMode === 'exact' ? (
                              Object.values(exactAmounts).filter(v => v && parseFloat(v) > 0).length === 0 ? 'Enter amounts' : `${Object.values(exactAmounts).filter(v => v && parseFloat(v) > 0).length} amounts entered`
                            ) : (
                              Object.values(percentages).filter(v => v && parseFloat(v) > 0).length === 0 ? 'Enter percentages' : `${Object.values(percentages).filter(v => v && parseFloat(v) > 0).length} percentages entered`
                            )}
                          </div>
                        </div>
                        <svg 
                          className={`w-5 h-5 text-static-text-400 flex-shrink-0 transition-transform ${openDropdownIndex === -2 ? 'rotate-180' : ''}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
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

          {/* Separate Side Panel */}
          {scannedReceipt && (openDropdownIndex === -1 || openDropdownIndex === -2) && (
            <div 
              className="assign-items-side-panel bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-96 flex-none flex flex-col overflow-hidden"
              style={{ height: sidePanelHeight ? `${Math.round(sidePanelHeight)}px` : undefined }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Side Panel Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 z-10 bg-white dark:bg-gray-800">
                <h3 className="text-lg font-semibold text-static-text-900 dark:text-static-text-50">
                  {openDropdownIndex === -1 ? 'Who paid?' : 
                    receiptSplitMode === 'itemized' ? 'Assign items' :
                    receiptSplitMode === 'equal' ? 'Split evenly' :
                    receiptSplitMode === 'exact' ? 'Exact amounts' :
                    'Percentage split'
                  }
                </h3>
                <button
                  onClick={() => setOpenDropdownIndex(null)}
                  className="text-static-text-500 hover:text-static-text-700 dark:text-static-text-400 dark:hover:text-static-text-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Side Panel Content */}
              <div 
                className="flex-1 min-h-0 overflow-y-auto p-4 fancy-scrollbar fancy-scrollbar--short px-1"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Member Selection Panel */}
                {openDropdownIndex === -1 && (
                  <div className="space-y-2">
                    {members.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => {
                          setExpensePaidBy(member.id);
                          setOpenDropdownIndex(null);
                        }}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                          expensePaidBy === member.id
                            ? 'bg-static-bg-100 dark:bg-static-bg-700 ring-2 ring-static-bg-500'
                            : 'hover:bg-static-bg-50 dark:hover:bg-static-bg-800'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                          {member.name[0].toUpperCase()}
                        </div>
                        <span className="text-static-text-900 dark:text-static-text-50 font-medium">
                          {member.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Items Assignment Panel - Different UI based on split mode */}
                {openDropdownIndex === -2 && scannedReceipt && members && members.length > 0 && (
                  <>
                    {/* ITEMIZED MODE - Original assignment UI */}
                    {receiptSplitMode === 'itemized' && scannedReceipt.items && scannedReceipt.items.length > 0 && (
                  <div className="space-y-4">
                    {/* Quick Assign Mode - Member Selector */}
                    <div>
                      <div className="text-xs font-medium text-static-text-500 dark:text-static-text-400 mb-2">
                        Quick assign mode
                      </div>
                      
                      {/* Show buttons if 4 or fewer members, otherwise show dropdown */}
                      {members.length <= 4 ? (
                        <div className="flex gap-2 flex-wrap">
                          {members.map((member) => (
                            <button
                              key={member.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setQuickAssignMemberId(quickAssignMemberId === member.id ? null : member.id);
                              }}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                                quickAssignMemberId === member.id
                                  ? 'bg-blue-600 text-white ring-2 ring-blue-300 dark:ring-blue-500'
                                  : 'bg-gray-100 dark:bg-gray-700 text-static-text-700 dark:text-static-text-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                              }`}
                            >
                              <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${getMemberColor(member.id, members)} flex items-center justify-center text-white text-xs font-semibold`}>
                                {member.name?.[0]?.toUpperCase() || '?'}
                              </div>
                              <span>{member.name?.split(' ')[0] || 'Unknown'}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenItemDropdownIndex(openItemDropdownIndex === -99 ? null : -99);
                            }}
                            className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border transition-all ${
                              quickAssignMemberId
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 dark:border-blue-600'
                                : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-750'
                            }`}
                          >
                            {quickAssignMemberId ? (
                              <div className="flex items-center gap-2">
                                <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${getMemberColor(quickAssignMemberId, members)} flex items-center justify-center text-white text-xs font-semibold`}>
                                  {members.find(m => m.id === quickAssignMemberId)?.name?.[0]?.toUpperCase() || '?'}
                                </div>
                                <span className="text-static-text-900 dark:text-static-text-50 font-medium">
                                  {members.find(m => m.id === quickAssignMemberId)?.name || 'Unknown'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-static-text-600 dark:text-static-text-400">Select a member...</span>
                            )}
                            <svg className="w-4 h-4 text-static-text-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          
                          {/* Dropdown menu */}
                          {openItemDropdownIndex === -99 && (
                            <div 
                              className="item-dropdown-container absolute left-0 right-0 top-full mt-1 z-10"
                              onClick={(e) => e.stopPropagation()}
                              onWheel={(e) => e.stopPropagation()}
                            >
                              <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-[280px] overflow-y-auto overscroll-contain fancy-scrollbar pr-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setQuickAssignMemberId(null);
                                    setOpenItemDropdownIndex(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700"
                                >
                                  <span className="text-static-text-600 dark:text-static-text-400 text-sm">Clear selection</span>
                                </button>
                                {members.map((member) => (
                                  <button
                                    key={member.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setQuickAssignMemberId(member.id);
                                      setOpenItemDropdownIndex(null);
                                    }}
                                    className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                                      quickAssignMemberId === member.id
                                        ? 'bg-blue-100 dark:bg-blue-900/50'
                                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                  >
                                    <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${getMemberColor(member.id, members)} flex items-center justify-center text-white text-xs font-semibold`}>
                                      {member.name?.[0]?.toUpperCase() || '?'}
                                    </div>
                                    <span className="text-static-text-900 dark:text-static-text-50 font-medium">
                                      {member.name || 'Unknown'}
                                    </span>
                                    {quickAssignMemberId === member.id && (
                                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {quickAssignMemberId && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                          Click items below to assign to {members.find(m => m.id === quickAssignMemberId)?.name || 'selected member'}
                        </p>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-200 dark:border-gray-700"></div>

                    {/* Items List - single scroll container is the parent above */}
                    <div className="space-y-1.5 pr-1">
                      {scannedReceipt.items.map((item, itemIndex) => {
                        if (!item) return null;
                        const assignments = itemAssignments[itemIndex] || [];
                        const showItemDropdown = openItemDropdownIndex === itemIndex;
                        
                        // For items with quantity > 1, get all unique members assigned across sub-items
                        let allAssignedMembers: string[] = [];
                        if (item.quantity && item.quantity > 1) {
                          const itemSplit = itemSplits[itemIndex] || {};
                          const allMemberIds = new Set<string>();
                          for (let i = 0; i < item.quantity; i++) {
                            const subItemAssignments = itemSplit[i] || [];
                            subItemAssignments.forEach(id => allMemberIds.add(id));
                          }
                          allAssignedMembers = Array.from(allMemberIds);
                        } else {
                          // For single items, use direct assignments
                          allAssignedMembers = assignments.map((a: any) => a?.memberId).filter(Boolean);
                        }
                        
                        const isFullyAssigned = allAssignedMembers.length > 0;
                        const firstMemberId = allAssignedMembers[0];
                        
                        return (
                          <div
                            key={itemIndex}
                            className="relative"
                          >
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                if (quickAssignMemberId) {
                                  // Quick assign mode
                                  if (item.quantity && item.quantity > 1) {
                                    // For quantity items: check if assigned to ALL sub-items
                                    const isFullyAssignedToMember = isMemberAssignedToAllSubItems(itemIndex, quickAssignMemberId, item.quantity);
                                    if (isFullyAssignedToMember) {
                                      removeMemberFromAllSubItems(itemIndex, quickAssignMemberId, item.quantity);
                                    } else {
                                      assignMemberToAllSubItems(itemIndex, quickAssignMemberId, item.quantity);
                                    }
                                  } else {
                                    // For single items: toggle direct assignment
                                    const isAssigned = assignments.some((a: any) => a?.memberId === quickAssignMemberId);
                                    if (isAssigned) {
                                      setItemAssignments(prev => ({
                                        ...prev,
                                        [itemIndex]: (prev[itemIndex] || []).filter((a: any) => a?.memberId !== quickAssignMemberId)
                                      }));
                                    } else {
                                      const splitCount = (assignments.length || 0) + 1;
                                      const splitAmount = (item.price || 0) / splitCount;
                                      const updatedAssignments = [
                                        ...assignments.map((a: any) => ({
                                          ...a,
                                          amount: splitAmount
                                        })),
                                        {
                                          memberId: quickAssignMemberId,
                                          memberName: members.find(m => m.id === quickAssignMemberId)?.name || 'Unknown',
                                          amount: splitAmount
                                        }
                                      ];
                                      setItemAssignments(prev => ({
                                        ...prev,
                                        [itemIndex]: updatedAssignments
                                      }));
                                    }
                                  }
                                }
                              }}
                              className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg transition-all border ${
                                isFullyAssigned && firstMemberId
                                  ? (() => {
                                      const gradient = getMemberColor(firstMemberId, members);
                                      const colorName = gradient.split('-')[1];
                                      const colorMap: Record<string, string> = {
                                        'blue': 'bg-blue-50/30 dark:bg-blue-900/10 border-blue-300 dark:border-blue-700',
                                        'pink': 'bg-pink-50/30 dark:bg-pink-900/10 border-pink-300 dark:border-pink-700',
                                        'green': 'bg-green-50/30 dark:bg-green-900/10 border-green-300 dark:border-green-700',
                                        'orange': 'bg-orange-50/30 dark:bg-orange-900/10 border-orange-300 dark:border-orange-700',
                                        'cyan': 'bg-cyan-50/30 dark:bg-cyan-900/10 border-cyan-300 dark:border-cyan-700',
                                        'violet': 'bg-violet-50/30 dark:bg-violet-900/10 border-violet-300 dark:border-violet-700',
                                        'red': 'bg-red-50/30 dark:bg-red-900/10 border-red-300 dark:border-red-700',
                                        'indigo': 'bg-indigo-50/30 dark:bg-indigo-900/10 border-indigo-300 dark:border-indigo-700',
                                        'lime': 'bg-lime-50/30 dark:bg-lime-900/10 border-lime-300 dark:border-lime-700',
                                        'fuchsia': 'bg-fuchsia-50/30 dark:bg-fuchsia-900/10 border-fuchsia-300 dark:border-fuchsia-700',
                                        'purple': 'bg-purple-50/30 dark:bg-purple-900/10 border-purple-300 dark:border-purple-700',
                                      };
                                      return colorMap[colorName] || 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700';
                                    })()
                                  : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-750'
                              } ${quickAssignMemberId ? 'cursor-pointer' : 'cursor-default'}`}
                            >
                              <div className="flex-1 min-w-0 flex items-center gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="font-medium text-static-text-900 dark:text-static-text-50 truncate">
                                    {item.name}
                                  </span>
                                  {item.quantity && item.quantity > 1 && (
                                    <span className="flex-shrink-0 px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-xs font-medium text-static-text-700 dark:text-static-text-300 rounded">
                                      ×{item.quantity}
                                    </span>
                                  )}
                                </div>
                                {allAssignedMembers.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    {allAssignedMembers.slice(0, 3).map((memberId, idx) => {
                                      const member = members.find(m => m.id === memberId);
                                      return (
                                        <div
                                          key={idx}
                                          className={`w-5 h-5 rounded-full bg-gradient-to-br ${getMemberColor(memberId, members)} flex items-center justify-center text-white text-[10px] font-bold`}
                                          title={member?.name || 'Unknown'}
                                        >
                                          {member?.name?.[0]?.toUpperCase() || '?'}
                                        </div>
                                      );
                                    })}
                                    {allAssignedMembers.length > 3 && (
                                      <span className="text-xs text-static-text-500">+{allAssignedMembers.length - 3}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {/* Split by quantity button - fixed position on left */}
                                <div className="w-6 flex-shrink-0">
                                  {item.quantity && item.quantity > 1 && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setExpandedQtyItemIndex(expandedQtyItemIndex === itemIndex ? null : itemIndex);
                                      }}
                                      className={`p-1 rounded transition-colors ${
                                        expandedQtyItemIndex === itemIndex 
                                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                                          : 'hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                      }`}
                                      title="Split by quantity"
                                      aria-label="Split by quantity"
                                    >
                                      <svg 
                                        className={`w-4 h-4 transition-transform ${expandedQtyItemIndex === itemIndex ? 'rotate-180' : ''}`} 
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                      >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                      </svg>
                                    </button>
                                  )}
                                </div>

                                {/* Price with fixed width */}
                                <span className="font-semibold text-static-text-900 dark:text-static-text-50 whitespace-nowrap tabular-nums text-right w-16">
                                  ${((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                                </span>

                                {/* Assign button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenItemDropdownIndex(showItemDropdown ? null : itemIndex);
                                  }}
                                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                  title="Assign to member"
                                  aria-label="Assign to member"
                                >
                                  <svg className="w-4 h-4 text-static-text-600 dark:text-static-text-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h7m0 0h7m-7 0v-3m0 3l3-3" />
                                  </svg>
                                </button>
                              </div>
                            </div>

                            {/* Dropdown for individual item assignment */}
                            {showItemDropdown && (
                              <div 
                                className="item-dropdown-container absolute right-0 top-full mt-1 z-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-2 min-w-[200px] max-h-[280px] overflow-y-auto overscroll-contain fancy-scrollbar pr-1"
                                onClick={(e) => e.stopPropagation()}
                                onWheel={(e) => e.stopPropagation()}
                              >
                                {members.map((member) => {
                                  if (!member) return null;
                                  
                                  // For items with quantity > 1, check assignment to sub-items
                                  // For items with quantity = 1, check direct assignment
                                  let isFullyAssigned = false;
                                  let isPartiallyAssigned = false;
                                  
                                  if (item.quantity && item.quantity > 1) {
                                    isFullyAssigned = isMemberAssignedToAllSubItems(itemIndex, member.id, item.quantity);
                                    isPartiallyAssigned = !isFullyAssigned && isMemberAssignedToSomeSubItems(itemIndex, member.id, item.quantity);
                                  } else {
                                    // For single quantity items, use direct assignment
                                    isFullyAssigned = assignments.some((a: any) => a?.memberId === member.id);
                                  }
                                  
                                  return (
                                    <button
                                      key={member.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        
                                        if (item.quantity && item.quantity > 1) {
                                          // For quantity items: toggle assignment to ALL sub-items
                                          if (isFullyAssigned) {
                                            removeMemberFromAllSubItems(itemIndex, member.id, item.quantity);
                                          } else {
                                            assignMemberToAllSubItems(itemIndex, member.id, item.quantity);
                                          }
                                        } else {
                                          // For single quantity items: use direct assignment with split logic
                                          if (isFullyAssigned) {
                                            setItemAssignments(prev => ({
                                              ...prev,
                                              [itemIndex]: (prev[itemIndex] || []).filter((a: any) => a?.memberId !== member.id)
                                            }));
                                          } else {
                                            const splitCount = (assignments.length || 0) + 1;
                                            const splitAmount = (item.price || 0) / splitCount;
                                            const updatedAssignments = [
                                              ...assignments.map((a: any) => ({
                                                ...a,
                                                amount: splitAmount
                                              })),
                                              {
                                                memberId: member.id,
                                                memberName: member.name || 'Unknown',
                                                amount: splitAmount
                                              }
                                            ];
                                            setItemAssignments(prev => ({
                                              ...prev,
                                              [itemIndex]: updatedAssignments
                                            }));
                                          }
                                        }
                                        
                                        // Auto-close dropdown after selection
                                        setOpenItemDropdownIndex(null);
                                      }}
                                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                                        isFullyAssigned
                                          ? 'bg-blue-100 dark:bg-blue-900/50 text-static-text-900 dark:text-static-text-50'
                                          : isPartiallyAssigned
                                          ? 'bg-blue-50 dark:bg-blue-900/20 text-static-text-900 dark:text-static-text-50'
                                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-static-text-700 dark:text-static-text-300'
                                      }`}
                                    >
                                      <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${getMemberColor(member.id, members)} flex items-center justify-center text-white text-xs font-bold`}>
                                        {member.name?.[0]?.toUpperCase() || '?'}
                                      </div>
                                      <span className="flex-1 font-medium">{member.name || 'Unknown'}</span>
                                      {isFullyAssigned && (
                                        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      )}
                                      {isPartiallyAssigned && (
                                        <svg className="w-4 h-4 text-blue-500 dark:text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                        </svg>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            {/* Inline Quantity Split UI - Expand into sub-items */}
                            {expandedQtyItemIndex === itemIndex && item.quantity && item.quantity > 1 && (
                              <div className="mt-2 ml-4 space-y-1.5 border-l-2 border-gray-300 dark:border-gray-600 pl-3">
                                {Array.from({ length: item.quantity }, (_, qtyIndex) => {
                                  const currentSplits = itemSplits[itemIndex] || {};
                                  const assignedIds = currentSplits[qtyIndex] || []; // Array of member IDs assigned to this sub-item
                                  const isSharedExpense = assignedIds.length > 1;
                                  
                                  return (
                                    <div
                                      key={qtyIndex}
                                      className="relative"
                                    >
                                      <div
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (quickAssignMemberId) {
                                            // Quick assign - toggle this member for this sub-item
                                            toggleMemberForSubItem(itemIndex, qtyIndex, quickAssignMemberId);
                                          }
                                        }}
                                        className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg transition-all border ${
                                          assignedIds.length > 0
                                            ? (() => {
                                                const firstMemberId = assignedIds[0];
                                                const gradient = getMemberColor(firstMemberId, members);
                                                const colorName = gradient.split('-')[1];
                                                const colorMap: Record<string, string> = {
                                                  'blue': 'bg-blue-50/30 dark:bg-blue-900/10 border-blue-300 dark:border-blue-700',
                                                  'pink': 'bg-pink-50/30 dark:bg-pink-900/10 border-pink-300 dark:border-pink-700',
                                                  'green': 'bg-green-50/30 dark:bg-green-900/10 border-green-300 dark:border-green-700',
                                                  'orange': 'bg-orange-50/30 dark:bg-orange-900/10 border-orange-300 dark:border-orange-700',
                                                  'cyan': 'bg-cyan-50/30 dark:bg-cyan-900/10 border-cyan-300 dark:border-cyan-700',
                                                  'violet': 'bg-violet-50/30 dark:bg-violet-900/10 border-violet-300 dark:border-violet-700',
                                                  'red': 'bg-red-50/30 dark:bg-red-900/10 border-red-300 dark:border-red-700',
                                                  'indigo': 'bg-indigo-50/30 dark:bg-indigo-900/10 border-indigo-300 dark:border-indigo-700',
                                                  'lime': 'bg-lime-50/30 dark:bg-lime-900/10 border-lime-300 dark:border-lime-700',
                                                  'fuchsia': 'bg-fuchsia-50/30 dark:bg-fuchsia-900/10 border-fuchsia-300 dark:border-fuchsia-700',
                                                  'purple': 'bg-purple-50/30 dark:bg-purple-900/10 border-purple-300 dark:border-purple-700',
                                                };
                                                return `border ${colorMap[colorName] || 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700'}`;
                                              })()
                                            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-750'
                                        } ${quickAssignMemberId ? 'cursor-pointer' : 'cursor-default'}`}
                                      >
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                          <span className="text-sm text-static-text-700 dark:text-static-text-400">
                                            #{qtyIndex + 1}
                                          </span>
                                          {assignedIds.length > 0 && (
                                            <div className="flex items-center gap-1">
                                              {assignedIds.slice(0, 3).map((memberId, idx) => {
                                                const member = members.find(m => m.id === memberId);
                                                return (
                                                  <div
                                                    key={idx}
                                                    className={`w-4 h-4 rounded-full bg-gradient-to-br ${getMemberColor(memberId, members)} flex items-center justify-center text-white text-[9px] font-bold`}
                                                    title={member?.name || 'Unknown'}
                                                  >
                                                    {member?.name?.[0]?.toUpperCase() || '?'}
                                                  </div>
                                                );
                                              })}
                                              {assignedIds.length > 3 && (
                                                <span className="text-xs text-static-text-500">+{assignedIds.length - 3}</span>
                                              )}
                                              {isSharedExpense && (
                                                <span className="text-xs text-purple-600 dark:text-purple-400 font-medium ml-1">
                                                  Shared
                                                </span>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                        
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                          <span className="text-sm font-medium text-static-text-900 dark:text-static-text-50 whitespace-nowrap tabular-nums">
                                            ${(item.price || 0).toFixed(2)}
                                          </span>
                                          
                                          {/* Assign button for this sub-item */}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const subItemKey = `${itemIndex}-${qtyIndex}`;
                                              setOpenItemDropdownIndex(
                                                openItemDropdownIndex === subItemKey ? null : (subItemKey as any)
                                              );
                                            }}
                                            className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                            title="Assign to member"
                                            aria-label="Assign to member"
                                          >
                                            <svg className="w-3.5 h-3.5 text-static-text-600 dark:text-static-text-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h7m0 0h7m-7 0v-3m0 3l3-3" />
                                            </svg>
                                          </button>
                                        </div>
                                      </div>

                                      {/* Dropdown for sub-item assignment */}
                                      {openItemDropdownIndex === `${itemIndex}-${qtyIndex}` && (
                                        <div 
                                          className="item-dropdown-container absolute right-0 top-full mt-1 z-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-2 min-w-[200px] max-h-[280px] overflow-y-auto overscroll-contain fancy-scrollbar pr-1"
                                          onWheel={(e) => e.stopPropagation()}
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          {members.map((member) => {
                                            if (!member) return null;
                                            const isAssigned = assignedIds.includes(member.id);
                                            return (
                                              <button
                                                key={member.id}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  // Toggle assignment for this sub-item
                                                  toggleMemberForSubItem(itemIndex, qtyIndex, member.id);
                                                  // Keep dropdown open for multi-select
                                                }}
                                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                                                  isAssigned
                                                    ? 'bg-blue-100 dark:bg-blue-900/50 text-static-text-900 dark:text-static-text-50'
                                                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-static-text-700 dark:text-static-text-300'
                                                }`}
                                              >
                                                <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${getMemberColor(member.id, members)} flex items-center justify-center text-white text-xs font-bold`}>
                                                  {member.name?.[0]?.toUpperCase() || '?'}
                                                </div>
                                                <span className="flex-1 font-medium">{member.name || 'Unknown'}</span>
                                                {isAssigned && (
                                                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
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
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                    {/* SPLIT EVENLY MODE */}
                    {receiptSplitMode === 'equal' && (
                      <div className="space-y-4">
                        <p className="text-sm text-static-text-600 dark:text-static-text-400 mb-4">
                          Select who will split this receipt equally
                        </p>
                        <div className="space-y-2">
                          {members.map((member) => {
                            const isSelected = selectedSplitMembers.includes(member.id);
                            return (
                              <button
                                key={member.id}
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedSplitMembers(selectedSplitMembers.filter(id => id !== member.id));
                                  } else {
                                    setSelectedSplitMembers([...selectedSplitMembers, member.id]);
                                  }
                                }}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                                  isSelected
                                    ? 'border-static-bg-700 bg-static-bg-700/10 dark:bg-static-bg-700/20'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                              >
                                <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                                  isSelected ? 'border-static-bg-700 bg-static-bg-700' : 'border-gray-300 dark:border-gray-600'
                                }`}>
                                  {isSelected && (
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getMemberColor(member.id, members)} flex items-center justify-center text-white font-semibold`}>
                                  {member.name[0].toUpperCase()}
                                </div>
                                <div className="flex-1 text-left">
                                  <div className="font-medium text-static-text-900 dark:text-static-text-50">{member.name}</div>
                                  {selectedSplitMembers.length > 0 && isSelected && (
                                    <div className="text-xs text-static-text-500 mt-0.5">
                                      {formatCurrency(
                                        ((scannedReceipt.total || scannedReceipt.items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0)) + (manualTip ? parseFloat(manualTip) : 0)) / selectedSplitMembers.length,
                                        currency
                                      )}
                                    </div>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        {selectedSplitMembers.length > 0 && (
                          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <div className="text-sm font-medium text-green-900 dark:text-green-100">
                              Each person pays: {formatCurrency(
                                ((scannedReceipt.total || scannedReceipt.items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0)) + (manualTip ? parseFloat(manualTip) : 0)) / selectedSplitMembers.length,
                                currency
                              )}
                            </div>
                            <div className="text-xs text-green-700 dark:text-green-300 mt-1">
                              {selectedSplitMembers.length} {selectedSplitMembers.length === 1 ? 'person' : 'people'} selected
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* EXACT AMOUNTS MODE */}
                    {receiptSplitMode === 'exact' && (
                      <div className="space-y-4">
                        <p className="text-sm text-static-text-600 dark:text-static-text-400 mb-4">
                          Enter the exact amount each person owes
                        </p>
                        <div className="space-y-3">
                          {members.map((member) => (
                            <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getMemberColor(member.id, members)} flex items-center justify-center text-white font-semibold flex-shrink-0`}>
                                {member.name[0].toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-static-text-900 dark:text-static-text-50 text-sm truncate">{member.name}</div>
                              </div>
                              <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus-within:border-static-accent-500 transition-colors bg-white dark:bg-gray-700">
                                <span className="text-sm text-static-text-500">$</span>
                                <input
                                  type="number"
                                  value={exactAmounts[member.id] || ''}
                                  onChange={(e) => setExactAmounts({...exactAmounts, [member.id]: e.target.value})}
                                  placeholder="0.00"
                                  step="0.01"
                                  min="0"
                                  className="w-20 bg-transparent text-static-text-900 dark:text-static-text-50 placeholder:text-static-text-600 dark:placeholder:text-static-text-500 focus:outline-none text-right"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                        {(() => {
                          const total = (scannedReceipt.total || scannedReceipt.items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0)) + (manualTip ? parseFloat(manualTip) : 0);
                          const allocated = Object.values(exactAmounts).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
                          const remaining = total - allocated;
                          return (
                            <div className="mt-6 space-y-2 text-sm px-3">
                              <div className="flex items-center justify-between gap-6 py-1">
                                <span className="text-static-text-600 dark:text-static-text-400">Total:</span>
                                <span className="font-semibold tabular-nums text-static-text-900 dark:text-static-text-50">{formatCurrency(total, currency)}</span>
                              </div>
                              <div className="flex items-center justify-between gap-6 py-1">
                                <span className="text-static-text-600 dark:text-static-text-400">Allocated:</span>
                                <span className="font-semibold tabular-nums text-static-text-900 dark:text-static-text-50">{formatCurrency(allocated, currency)}</span>
                              </div>
                              <div className="flex items-center justify-between gap-6 pt-2 border-t border-gray-300 dark:border-gray-700">
                                <span className="text-static-text-600 dark:text-static-text-400">Remaining:</span>
                                <span className="font-bold tabular-nums text-static-text-900 dark:text-static-text-50">{formatCurrency(remaining, currency)}</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* PERCENTAGE MODE */}
                    {receiptSplitMode === 'percentage' && (
                      <div className="space-y-4">
                        <p className="text-sm text-static-text-600 dark:text-static-text-400 mb-4">
                          Enter the percentage each person owes
                        </p>
                        <div className="space-y-3">
                          {members.map((member) => {
                            const percentage = parseFloat(percentages[member.id] || '0');
                            const total = (scannedReceipt.total || scannedReceipt.items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0)) + (manualTip ? parseFloat(manualTip) : 0);
                            const amount = (percentage / 100) * total;
                            return (
                              <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getMemberColor(member.id, members)} flex items-center justify-center text-white font-semibold flex-shrink-0`}>
                                  {member.name[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-static-text-900 dark:text-static-text-50 text-sm truncate">{member.name}</div>
                                  {percentage > 0 && (
                                    <div className="text-xs text-static-text-500 mt-0.5">
                                      {formatCurrency(amount, currency)}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus-within:border-static-accent-500 transition-colors bg-white dark:bg-gray-700">
                                  <input
                                    type="number"
                                    value={percentages[member.id] || ''}
                                    onChange={(e) => setPercentages({...percentages, [member.id]: e.target.value})}
                                    placeholder="0"
                                    step="1"
                                    min="0"
                                    max="100"
                                    className="w-16 bg-transparent text-static-text-900 dark:text-static-text-50 placeholder:text-static-text-600 dark:placeholder:text-static-text-500 focus:outline-none text-right"
                                  />
                                  <span className="text-sm text-static-text-500">%</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {(() => {
                          const totalPercent = Object.values(percentages).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
                          const remaining = 100 - totalPercent;
                          return (
                            <div className="mt-6 space-y-2 text-sm px-3">
                              <div className="flex items-center justify-between gap-6 py-1">
                                <span className="text-static-text-600 dark:text-static-text-400">Total percentage:</span>
                                <span className="font-semibold tabular-nums text-static-text-900 dark:text-static-text-50">{totalPercent.toFixed(1)}%</span>
                              </div>
                              {Math.abs(remaining) >= 0.01 && (
                                <div className="text-xs text-static-text-600 dark:text-static-text-400 px-0.5">
                                  {remaining > 0 ? `${remaining.toFixed(1)}% remaining` : `Over by ${Math.abs(remaining).toFixed(1)}%`}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
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
            className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-h-[85vh] overflow-y-auto">
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
                    onChange={() => {
                      setTipSplitType('custom');
                      setShowTipMemberSelectModal(true);
                    }}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="text-base font-semibold text-static-text-900 dark:text-static-text-50 mb-1">
                      Select Who Pays Tip
                    </div>
                    <div className="text-sm text-static-text-600 dark:text-static-text-400">
                      Choose specific people to split the tip proportionally.
                    </div>
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

            {/* Inline Member Selection Screen (slides up inside this container) */}
            <div
              className={`absolute inset-0 bg-white dark:bg-gray-900 flex flex-col transition-transform duration-300 ease-out ${
                showTipMemberSelectModal ? 'translate-y-0' : 'translate-y-full'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-5 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-static-text-900 dark:text-static-text-50">Select Who Pays Tip</h3>
                  <p className="text-sm text-static-text-600 dark:text-static-text-400 mt-1">
                    Choose the people who will split the tip proportionally
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Back button */}
                  <button
                    onClick={() => setShowTipMemberSelectModal(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    aria-label="Back"
                  >
                    <svg className="w-6 h-6 text-static-text-600 dark:text-static-text-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5m7-7l-7 7 7 7" />
                    </svg>
                  </button>
                  {/* Close whole tip modal */}
                  <button
                    onClick={() => setShowTipSplitModal(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    aria-label="Close"
                  >
                    <svg className="w-6 h-6 text-static-text-600 dark:text-static-text-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Members List - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-3">
                  {members.map((member) => {
                    const isSelected = tipAssignedMembers.includes(member.id);
                    return (
                      <button
                        key={member.id}
                        onClick={() => {
                          if (isSelected) {
                            setTipAssignedMembers(tipAssignedMembers.filter((id) => id !== member.id));
                          } else {
                            setTipAssignedMembers([...tipAssignedMembers, member.id]);
                          }
                        }}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                          isSelected
                            ? 'border-static-bg-700 bg-static-bg-700/10 dark:bg-static-bg-700/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        {/* Checkbox */}
                        <div
                          className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                            isSelected ? 'border-static-bg-700 bg-static-bg-700' : 'border-gray-300 dark:border-gray-600'
                          }`}
                        >
                          {isSelected && (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>

                        {/* Member info */}
                        <div className="flex-1 text-left">
                          <div className="text-base font-semibold text-static-text-900 dark:text-static-text-50">{member.name}</div>
                          {member.email && <div className="text-xs text-static-text-500 mt-0.5">{member.email}</div>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
                <button
                  onClick={() => setShowTipMemberSelectModal(false)}
                  disabled={tipAssignedMembers.length === 0}
                  className={`w-full px-4 py-2.5 rounded-lg font-medium transition-colors ${
                    tipAssignedMembers.length === 0
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-static-bg-700 hover:bg-static-bg-600 text-white'
                  }`}
                >
                  {tipAssignedMembers.length === 0
                    ? 'Select at least one person'
                    : `Done (${tipAssignedMembers.length} selected)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Image Viewer */}
      {viewingReceiptImageUrl && (
        <div
          className="fixed inset-0 z-[10003] flex items-center justify-center bg-black/60 p-4"
          onClick={() => setViewingReceiptImageUrl(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden shadow-2xl max-w-3xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={viewingReceiptImageUrl}
              alt="Receipt"
              className="w-full h-auto max-h-[85vh] object-contain"
            />
            <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <p className="text-sm text-static-text-600 dark:text-static-text-400">Click outside to close</p>
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
      )}

      {/* Itemized Breakdown Modal */}
      {showItemizedExpenseId && (() => {
        const expense = expenses.find(e => e.id === showItemizedExpenseId);
        if (!expense) return null;
        
        const expenseWithReceipt = expense as any;
        if (!expenseWithReceipt.receiptDetails?.items) return null;

        return (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowItemizedExpenseId(null)}
          >
            <div 
              className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <h3 className="text-lg font-semibold text-static-text-900 dark:text-static-text-50">
                  Itemized Breakdown
                </h3>
                <button
                  onClick={() => setShowItemizedExpenseId(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-static-text-600 dark:text-static-text-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Body - with custom scrollbar */}
              <div className="flex-1 overflow-y-auto min-h-0" style={{ 
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgb(75 85 99) transparent'
              }}>
                <style jsx>{`
                  div::-webkit-scrollbar {
                    width: 6px;
                  }
                  div::-webkit-scrollbar-track {
                    background: transparent;
                  }
                  div::-webkit-scrollbar-thumb {
                    background: rgb(75 85 99);
                    border-radius: 3px;
                  }
                  div::-webkit-scrollbar-thumb:hover {
                    background: rgb(107 114 128);
                  }
                `}</style>
                <div className="p-4">
                  <div className="space-y-0">
                    {expenseWithReceipt.receiptDetails.items.map((item: any, idx: number) => {
                      const assignedMembers = item.assignedTo || [];
                      const splits = item.splits || {};
                      // Check if splits has any sub-items with assigned members
                      const hasSplits = Object.keys(splits).length > 0 && 
                        Object.values(splits).some((subMembers: any) => 
                          Array.isArray(subMembers) && subMembers.length > 0
                        );

                      // Get assigned member names
                      let assignedText = '';
                      if (hasSplits) {
                        // splits structure: { 0: ['memberId1'], 1: ['memberId2'], ... }
                        // Collect all unique member IDs across all sub-items
                        const allMemberIds = new Set<string>();
                        Object.values(splits).forEach((subItemMembers: any) => {
                          if (Array.isArray(subItemMembers)) {
                            subItemMembers.forEach(id => allMemberIds.add(id));
                          }
                        });
                        
                        assignedText = Array.from(allMemberIds)
                          .map(memberId => {
                            const member = members.find(m => m.id === memberId);
                            return member?.name || 'Unknown';
                          })
                          .join(', ');
                      } else if (assignedMembers.length > 0) {
                        assignedText = assignedMembers
                          .map((memberId: string) => {
                            const member = members.find(m => m.id === memberId);
                            return member?.name || 'Unknown';
                          })
                          .join(', ');
                      }

                      return (
                        <div key={idx} className="flex justify-between items-center py-2 px-3 border-b border-gray-200 dark:border-gray-800 last:border-b-0 gap-3">
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-static-text-900 dark:text-static-text-50">
                              {item.name}
                            </span>
                            {assignedText && (
                              <span className="ml-2 text-sm text-static-text-500 dark:text-static-text-400">
                                ({assignedText})
                              </span>
                            )}
                          </div>
                          <span className="text-lg font-bold text-static-text-900 dark:text-static-text-50 whitespace-nowrap tabular-nums">
                            {formatCurrency(item.price * (item.quantity || 1), currency)}
                          </span>
                        </div>
                      );
                    })}
                    
                    {/* Add tax line if present */}
                    {expenseWithReceipt.receiptDetails.tax && (
                      <div className="flex justify-between items-center py-2 px-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                        <span className="font-medium text-static-text-700 dark:text-static-text-300">Tax</span>
                        <span className="text-lg font-bold text-static-text-900 dark:text-static-text-50 tabular-nums">
                          {formatCurrency(expenseWithReceipt.receiptDetails.tax, currency)}
                        </span>
                      </div>
                    )}
                    
                    {/* Add tip line if present */}
                    {expenseWithReceipt.receiptDetails.tip && (
                      <div className="flex justify-between items-center py-2 px-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                        <span className="font-medium text-static-text-700 dark:text-static-text-300">Tip</span>
                        <span className="text-lg font-bold text-static-text-900 dark:text-static-text-50 tabular-nums">
                          {formatCurrency(expenseWithReceipt.receiptDetails.tip, currency)}
                        </span>
                      </div>
                    )}

                    {/* Total */}
                    <div className="flex justify-between items-center py-3 px-3 bg-blue-50 dark:bg-blue-900/20 border-t-2 border-blue-200 dark:border-blue-700">
                      <span className="text-lg font-bold text-static-text-900 dark:text-static-text-50">Total</span>
                      <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                        {formatCurrency(expense.totalAmount, currency)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Per-person tax and tip breakdown - compact table */}
                  {expenseWithReceipt.receiptDetails.memberBreakdowns && 
                   (expenseWithReceipt.receiptDetails.tax > 0 || expenseWithReceipt.receiptDetails.tip > 0) && (
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-xs font-semibold text-static-text-700 dark:text-static-text-300 mb-2">
                        Per-Person Tax & Tip Breakdown:
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-[10px] border-collapse">
                          <thead>
                            <tr className="border-b border-gray-300 dark:border-gray-600">
                              <th className="text-left py-1 px-2 font-semibold text-static-text-700 dark:text-static-text-300">Name</th>
                              <th className="text-right py-1 px-2 font-semibold text-static-text-700 dark:text-static-text-300">Items</th>
                              {expenseWithReceipt.receiptDetails.tax > 0 && (
                                <th className="text-right py-1 px-2 font-semibold text-static-text-700 dark:text-static-text-300">Tax</th>
                              )}
                              {expenseWithReceipt.receiptDetails.tip > 0 && (
                                <th className="text-right py-1 px-2 font-semibold text-static-text-700 dark:text-static-text-300">Tip</th>
                              )}
                              <th className="text-right py-1 px-2 font-semibold text-static-text-800 dark:text-static-text-200">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(expenseWithReceipt.receiptDetails.memberBreakdowns).map(([memberId, breakdown]: [string, any]) => {
                              const member = members.find(m => m.id === memberId);
                              return (
                                <tr key={memberId} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                                  <td className="py-1 px-2 font-medium text-static-text-800 dark:text-static-text-200">
                                    {member?.name || 'Unknown'}
                                  </td>
                                  <td className="py-1 px-2 text-right tabular-nums text-static-text-600 dark:text-static-text-400">
                                    {formatCurrency(breakdown.items, currency)}
                                  </td>
                                  {expenseWithReceipt.receiptDetails.tax > 0 && (
                                    <td className="py-1 px-2 text-right tabular-nums text-static-text-600 dark:text-static-text-400">
                                      {formatCurrency(breakdown.tax, currency)}
                                    </td>
                                  )}
                                  {expenseWithReceipt.receiptDetails.tip > 0 && (
                                    <td className="py-1 px-2 text-right tabular-nums text-static-text-600 dark:text-static-text-400">
                                      {formatCurrency(breakdown.tip, currency)}
                                    </td>
                                  )}
                                  <td className="py-1 px-2 text-right tabular-nums font-semibold text-static-text-800 dark:text-static-text-200">
                                    {formatCurrency(breakdown.total, currency)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  {/* Show note about distribution */}
                  {(expenseWithReceipt.receiptDetails.tax || expenseWithReceipt.receiptDetails.tip) && (
                    <div className="text-xs text-static-text-500 italic mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      Note: Tax and tip are distributed proportionally among participants based on their items.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
