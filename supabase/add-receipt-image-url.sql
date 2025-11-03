-- Add receiptImageUrl column to track receipt images for expenses
-- This will be stored in the trip JSON structure, but documenting here for reference

-- For expenses stored in trips.expenses JSON array, add this field:
-- receiptImageUrl: string (nullable)

-- Example expense structure:
-- {
--   "id": "expense_123",
--   "description": "Dinner at Restaurant",
--   "amount": 85.50,
--   "category": "Food",
--   "date": "2024-01-15",
--   "paidBy": "user_id",
--   "shares": [...],
--   "receiptImageUrl": "https://xyz.supabase.co/storage/v1/object/public/receipts/user_id/12345-receipt.jpg"
-- }

-- No migration needed since expenses are stored as JSONB in trips table
-- This file serves as documentation for the schema addition
