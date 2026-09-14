import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const requiredTables = [
  'users',
  'sellers',
  'categories',
  'products',
  'addresses',
  'carts',
  'cart_items',
  'orders',
  'order_items',
  'payments',
  'reviews',
  'loqcoin_balances',
  'loqcoin_ledger',
  'swadeshi_rank_history',
  'seller_approvals',
  'product_approvals',
  'coupons',
  'wishlists',
  'notifications',
  'seller_payouts'
];

async function verifyTables() {
  console.log("Starting Database Verification...");
  let allExist = true;

  for (const table of requiredTables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    
    if (error) {
      if (error.code === '42P01') {
        console.error(`❌ Missing Table: ${table}`);
        allExist = false;
      } else {
        console.warn(`⚠️ Error querying ${table}: ${error.message} (Code: ${error.code})`);
      }
    } else {
      console.log(`✅ Table verified: ${table}`);
    }
  }

  if (allExist) {
    console.log("\n🎉 SUCCESS: All required tables exist in your remote Supabase database!");
  } else {
    console.error("\n🚨 FAILED: Some tables are missing. The schema.sql needs to be pushed.");
  }
}

verifyTables();
