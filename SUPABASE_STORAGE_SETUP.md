# Supabase Storage Setup for Receipt Images

This document explains how to set up Supabase Storage for storing receipt images.

## Overview

Receipt images are uploaded to Supabase Storage when users scan receipts. The images are:
- Stored securely in user-specific folders
- Protected by Row Level Security (RLS) policies
- Referenced in expense records via URLs
- Accessible only to the user who uploaded them

## Setup Instructions

### 1. Run the Storage Bucket Migration

Execute the SQL migration to create the storage bucket and set up policies:

```bash
# In Supabase Dashboard > SQL Editor, run:
supabase/storage-receipts-setup.sql
```

Or manually:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/storage-receipts-setup.sql`
4. Click **Run**

### 2. Verify Bucket Creation

1. Go to **Storage** in your Supabase dashboard
2. You should see a bucket named `receipts`
3. Click on it to view the bucket settings

### 3. Check Policies

In the Storage section, verify these policies are active on the `receipts` bucket:
- ✅ Users can upload their own receipts (INSERT)
- ✅ Users can view their own receipts (SELECT)
- ✅ Users can delete their own receipts (DELETE)
- ✅ Users can update their own receipts (UPDATE)

## How It Works

### File Structure

Receipt images are stored with this path structure:
```
receipts/
  └── {userId}/
      └── {timestamp}-{filename}
```

Example: `receipts/123e4567-e89b-12d3-a456-426614174000/1699123456789-receipt.jpg`

### Upload Flow

1. User scans a receipt in the Budget view
2. Image is sent to `/api/scan-receipt`
3. API authenticates the user
4. Image is uploaded to Supabase Storage in user's folder
5. Google Vision API processes the image for OCR
6. Both the OCR results and image URL are returned
7. When expenses are created, the image URL is saved in `receiptImageUrl` field

### Security

- **Authentication Required**: Only authenticated users can upload images
- **User Isolation**: Users can only access their own images (enforced by folder path)
- **RLS Policies**: Supabase policies prevent unauthorized access
- **Private Bucket**: The bucket is not publicly accessible by default

## API Response

The `/api/scan-receipt` endpoint now returns:

```json
{
  "fullText": "Full OCR text...",
  "imageUrl": "https://xyz.supabase.co/storage/v1/object/public/receipts/user-id/12345-receipt.jpg",
  "items": [...],
  "total": 88.88,
  "tax": 5.03
}
```

## Expense Structure

Expenses now include the receipt image URL:

```typescript
{
  id: "expense-123",
  description: "Receipt",
  totalAmount: 88.88,
  paidBy: "user-id",
  receiptImageUrl: "https://...", // NEW FIELD
  receiptDetails: {
    items: [...],
    // ...
  }
}
```

## Storage Limits

Supabase Free Tier:
- **Storage**: 1 GB
- **Bandwidth**: 2 GB/month
- **File uploads**: Unlimited

If you need more:
- Pro Plan: $25/month (100 GB storage, 200 GB bandwidth)
- Or upgrade storage separately

## Future Enhancements

Potential improvements:
1. Add image compression before upload
2. Add thumbnail generation
3. Add ability to view receipt images in expense details
4. Add bulk receipt upload
5. Add receipt image gallery view

## Troubleshooting

### "Unauthorized" Error
- Ensure user is authenticated before scanning
- Check if Clerk/Supabase auth is working properly

### "Upload Failed" Error
- Check if the `receipts` bucket exists
- Verify RLS policies are set up correctly
- Check Supabase project quota

### Images Not Showing
- Verify the image URL is being saved in the expense
- Check browser console for CORS errors
- Ensure the bucket has the correct public access settings
