-- Add Apple StoreKit subscription fields per v4.1 patch §8.1
-- The mobile app writes here via /api/storekit/verify; web continues to use
-- the existing Stripe fields for SyncFit+ subscriptions purchased on web.

-- Extend the subscription_status enum.
alter type subscription_status add value if not exists 'expired';
alter type subscription_status add value if not exists 'in_grace_period';
alter type subscription_status add value if not exists 'in_billing_retry';
alter type subscription_status add value if not exists 'revoked';

create type apple_environment as enum ('Sandbox', 'Production');

alter table subscriptions
  add column if not exists apple_original_transaction_id text,
  add column if not exists apple_product_id text,
  add column if not exists expires_at timestamptz,
  add column if not exists auto_renew_status boolean,
  add column if not exists environment apple_environment,
  add column if not exists last_verified_at timestamptz;

create index if not exists subscriptions_apple_orig_tx_idx
  on subscriptions (apple_original_transaction_id);
