#!/bin/bash
echo "🔧 Fixing Clerk authentication issues..."
echo "1. Clearing browser localStorage..."
echo "   Open browser console and run: localStorage.clear(); sessionStorage.clear();"
echo ""
echo "2. Clearing Next.js cache..."
rm -rf .next
echo "   ✓ Cleared .next directory"
echo ""
echo "3. Restart dev server with: npm run dev"
echo ""
echo "✨ Done! Now hard refresh your browser (Cmd+Shift+R)"
