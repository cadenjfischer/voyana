# Clerk Authentication Troubleshooting Guide

## 🔧 Quick Fixes When Sign-In Stops Working

### Method 1: Browser Clear (Fastest - 10 seconds)
1. Open browser DevTools (F12 or Cmd+Option+I)
2. Go to Console tab
3. Run these commands:
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```

### Method 2: Hard Refresh
- **Mac**: `Cmd + Shift + R`
- **Windows/Linux**: `Ctrl + Shift + R`

### Method 3: Clear Next.js Cache (When others don't work)
```bash
rm -rf .next
npm run dev
```

### Method 4: Nuclear Option (Rarely needed)
```bash
# Clear everything
rm -rf .next node_modules/.cache
# Clear browser storage (see Method 1)
# Restart dev server
npm run dev
```

## 🐛 Common Issues & Solutions

### Issue: "Loading your trips..." stuck forever
**Cause**: Clerk session expired or cached
**Fix**: Use Method 1 (Browser Clear)

### Issue: Sign-in button doesn't work
**Cause**: Clerk's dev environment rate limiting
**Fix**: Wait 30 seconds, then try Method 1

### Issue: 404 errors for Clerk resources
**Cause**: Next.js HMR broke Clerk's client bundle
**Fix**: Use Method 3 (Clear .next cache)

### Issue: Works for a while, then stops randomly
**Cause**: Normal Clerk development behavior
**Fix**: Use Method 1 whenever it happens (becomes muscle memory)

## 💡 Prevention Tips

1. **Don't spam refresh** - Clerk dev mode has rate limits
2. **Use one browser tab** - Multiple tabs can cause session conflicts
3. **Hard refresh after code changes** - Especially middleware or auth code
4. **Keep console open** - Errors usually show there first

## 🚀 Production Note

These issues are **development-only**. In production, Clerk is much more stable because:
- Production tokens have longer lifetimes
- No HMR interference
- Better caching strategies
- Higher rate limits

## 📝 Quick Command Reference

```bash
# Clear cache and restart
rm -rf .next && npm run dev

# Check if dev server is running
lsof -ti:3000

# Kill process on port 3000
kill -9 $(lsof -ti:3000)

# Start fresh dev server
npm run dev
```

## 🔑 When to Check Environment Variables

If none of the above work, verify your `.env.local`:
```bash
cat .env.local | grep CLERK
```

Make sure you have:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`

---

**Remember**: This is normal for Clerk's development mode. Just keep Method 1 in your back pocket! 🎯
