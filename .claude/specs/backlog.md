# Pipit Feature Backlog

Prioritized list of features for Claude to work on. Mark items as `[x]` when complete.

---

## Priority 1: Pre-Deployment Technical ✅

These must be done before production launch.

### Real Authentication ✅
- [x] Replace mock auth with Supabase Auth
- [x] Phone number + OTP verification
- [x] Session management (auto-restore on reload)
- [x] Auth state listener (multi-tab sync, token refresh)
- [x] Secure logout

### Image Storage ✅
- [x] Cloudinary integration for image uploads
- [x] Image compression and optimization (via processImage)
- [x] Multiple image support per listing (up to 6)

### Stripe Webhooks ✅
- [x] Handle payment_intent.succeeded
- [x] Handle payment_intent.payment_failed
- [x] Handle payment_intent.canceled
- [x] Handle account.updated (for Connect)
- [x] Handle charge.refunded
- [x] Handle payout.paid
- [x] Secure webhook signature verification

---

## Priority 2: Core Features

### Search Improvements ✅
- [x] Search by brand
- [x] Search history
- [x] Popular searches suggestions
- [x] Fuzzy matching

### Notifications ✅
- [x] In-app notifications
- [x] New message alerts
- [x] Offer updates
- [x] Transaction status changes
- [x] New follower alerts

### Reviews Enhancement ✅
- [x] Photo reviews
- [x] Review responses from sellers
- [x] Review filtering

---

## Priority 3: Growth Features

### Social Features
- [ ] Share listings to social media
- [ ] Invite friends flow
- [ ] Community guidelines

### Seller Tools ✅
- [x] Bulk listing creation
- [x] Pricing suggestions (AI)
- [x] Inventory management
- [x] Sales analytics

---

## Priority 4: Nice to Have

### Personalization ✅
- [x] Recommended listings
- [x] "You might like" section
- [x] Recently viewed

### Advanced Features ✅
- [x] Wishlist with price alerts
- [x] Bundle deals
- [x] Shipping option (not just local)

---

## Completed

- [x] Rich user profiles (bio, neighborhood, kid ages)
- [x] Follow system
- [x] Following feed tab
- [x] Post-transaction follow prompts
- [x] New near you section
- [x] Offer/negotiation system
- [x] Category filter reset fix

---

## Notes

When working on features:
1. Check `.claude/skills/feature-dev/SKILL.md` for implementation patterns
2. Update this file when complete
3. Run `npm run build` to verify
