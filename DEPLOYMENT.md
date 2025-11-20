# 🚀 Deploying Folio to Vercel

## Quick Deploy (Recommended)

### Option 1: Vercel CLI (Easiest)

```bash
# Install Vercel CLI globally
npm install -g vercel

# Navigate to project directory
cd /Users/chris/stockbasket

# Deploy (follow the prompts)
vercel

# When prompted:
# - Set up and deploy? Yes
# - Which scope? (Select your account)
# - Link to existing project? No
# - Project name? folio (or your preferred name)
# - Directory? ./ (press enter)
# - Override settings? No

# Your app will be deployed and you'll get a URL!
```

### Option 2: Vercel Dashboard (Visual)

1. **Push to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Ready for deployment - Folio v1.0"
   git push origin main
   ```

2. **Go to Vercel**:
   - Visit [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "Add New Project"
   - Import your `stockbasket` repository

3. **Configure** (defaults are fine):
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

4. **Deploy**:
   - Click "Deploy"
   - Wait ~2 minutes
   - Done! 🎉

## Custom Domain (Optional)

### After deployment:

1. Go to your project on Vercel
2. Click "Settings" → "Domains"
3. Add your custom domain (e.g., `folio.christanley.xyz`)
4. Follow DNS instructions
5. SSL is automatic!

## Post-Deployment Checklist

- [ ] Visit your live URL
- [ ] Test creating a basket
- [ ] Add some stocks (AAPL, TSLA, etc.)
- [ ] Check the about page
- [ ] Test on mobile
- [ ] Share with friends! 🎊

## Environment Variables

✅ **None needed!** Folio uses:
- Browser localStorage (no database)
- Yahoo Finance public API (no key required)

## Troubleshooting

### Build fails?
```bash
# Test build locally first
npm run build

# If success, try deploying again
vercel --force
```

### App works locally but not on Vercel?
- Check the build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Try `vercel --debug` for verbose logging

### Need to redeploy?
```bash
# From project directory
vercel --prod
```

## Future Enhancements

Want to add a database later?

1. **Add Supabase** (free tier):
   - Create project at supabase.com
   - Add env vars to Vercel
   - Update `useBaskets` hook
   - ~30 min of work

2. **Add Auth**:
   - Clerk or NextAuth.js
   - Protect routes
   - User-specific baskets

---

**Questions?** Check the [Vercel Docs](https://vercel.com/docs) or ping me!

Built by [Chris Tanley](https://christanley.xyz)
