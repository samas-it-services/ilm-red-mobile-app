# Billing tab on api.ilm.red, with Zelle top-ups (v1.5.0)

## Task
Move the Billing tab off the retired `/billing/*` endpoints onto api.ilm.red, and let members add
funds by Zelle, with the billing agreement step and sales tax shown line by line.

## Purpose
The same credits, top-ups and receipts as the website, from the same API. Members on Android can
top up by Zelle without leaving the app; iOS links to the website.

## Phases
1. Hooks (`hooks/useBilling.ts`) on the typed client: credit account from `getMyEntitlements.billing`,
   payment methods, my top-ups, my payments, the billing agreement, and the create / sent / cancel /
   accept mutations. Acceptance: no call to `/billing/balance`, `/billing/limits`, `/billing/usage`
   or `/billing/transactions`.
2. Billing tab: "You can spend" (allowance left + purchased - held), Add funds, Your top-ups,
   Receipts. Acceptance: numbers match Premium > Billing on ilm.red for the same account.
3. Zelle flow (Android): packages $5/$20/$50/$100 within the method's min and max, other amount,
   tax preview in lines (California state, Santa Clara County, City of Milpitas), billing agreement
   sheet when required, QR code drawn from `qr_payload`, recipient / amount / memo with share-to-copy,
   "I've sent it", cancel. Acceptance: a $20 top-up shows $1.45 + $0.50 + $0.05 tax and 18.00 credits.
4. iOS: "Add funds on ilm.red" opens Premium in the browser. Acceptance: no Zelle flow on iOS.

## Assumptions
- App Store rules require in-app purchase for digital credits bought inside an iOS app; linking to
  the website is allowed. Google Play is treated as permitting the Zelle flow (owner's decision,
  2026-09-25).
- Zelle stays switched off on the server until Finance turns it on; until then Add funds says it is
  not open yet.
- The contract lives in ilm-red-unbound (`openapi/premium.yaml`, `openapi/me.yaml`); the client is
  synced, never edited here.
- No clipboard module is installed (adding one needs a new native build), so copy goes through the
  share sheet and the values are selectable.

## Testing criteria
- `tsc --noEmit` has no errors in the changed files.
- Manual checks in the CHANGELOG entry, on an Android device and an iPhone.
