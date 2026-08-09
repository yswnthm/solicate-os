# …3004 #1 — Index cleanup checklist (final, 09 Aug)

Three actions in wp-admin. Purge LiteSpeed cache after changes.

> **Progress 09 Aug:** B (TRASH) 20/20 done. A (NOINDEX) and C (ask) untouched.

## A. NOINDEX — stay live, drop from Google (17)
Yoast panel → Advanced → Robots meta index → `noindex` → Update.

- [ ] Cart
- [ ] Checkout
- [ ] My account
- [ ] Log In
- [ ] Tickets Checkout
- [ ] Membership
- [ ] My audios
- [ ] Editor
- [ ] Newsletter sign up
- [ ] Your Profile
- [ ] Z Membership Account
- [ ] Z Membership Billing
- [ ] Z Membership Cancel
- [ ] Z Membership Checkout
- [ ] Z Membership Confirmation
- [ ] Z Membership Levels
- [ ] Z Membership Orders

## B. TRASH — delete, URL 404s (20)
Pages → hover → Trash. (Recoverable 30 days; keep a note if needed.)

- [x] Product – Staging
- [x] Reserve-old
- [x] Sacred Offerings-old
- [x] Share-old
- [x] Shop-Old
- [x] Shop-old-feb
- [x] The Stillness Habit-old
- [x] Z home page dummy
- [x] Z Home-old
- [x] Z Homepage-Staging (Draft)
- [ ] Z-About-old
- [x] Z -Blog-old
- [x] Z Corporate-old
- [x] Z Curated Calm-old
- [ ] Z indigogo Affirmation Cards Decks
- [ ] Z Corporate – Snail mail- [#368] (Draft)
- [x] Z Elementor #2398 (Draft)
- [x] Z Elementor #2601 (Draft)
- [x] Z Elementor #4488 (Draft)
- [ ] Z Membership Plans (Draft)

## C. ASK client — keep live + indexable for now (9)
- [ ] Astrology
- [ ] Curated-calm
- [ ] digital journal
- [ ] Echo project
- [ ] floating
- [ ] Nervous sytem reset
- [ ] reviews
- [ ] Privacy Policy (Draft)
- [ ] Refund and Returns Policy (Draft)

## D. KEEP — canonical, untouched (14)
Home · Contact Us · Corporate Wellness · Hawaii Retreat · Kids Mindfulness Card
Decks · Men's Wellness Circle · Reserve · Share · Shop · Sound Bath Events ·
Sound Healing Facilitator · The Stillness Habit · Wellness Blog · Wellness
Memberships.

## Verify after (I'll re-run)
- Trashed URLs return 404
- Noindexed URLs carry `<meta name="robots" content="noindex...">`
- `site:` query drops the trashed + noindexed set
