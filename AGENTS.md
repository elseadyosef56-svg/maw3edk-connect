# Architecture rules
- Service pictures use the existing `image_url` field and user-scoped Storage paths; this preserves tenant upload isolation without a new schema.
- Booking notices query only the current business and refresh every 30 seconds while visible; this works without depending on unconfigured realtime and avoids background polling.
- Support contact links share one module; this keeps the phone and WhatsApp destinations consistent.
- Package prices and marketing names share src/lib/plans.ts; this keeps landing, billing and new payment requests consistent.
- Wallet request approval uses a role-checked atomic RPC distinct from subscriptions; this prevents duplicate credits and accidental subscription renewal.
- Home bakery uses the existing category, services and employee tables; this preserves tenant isolation and avoids a second order system.