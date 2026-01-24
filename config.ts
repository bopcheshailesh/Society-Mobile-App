
/**
 * PRODUCTION CONFIGURATION
 * 
 * To move to production:
 * 1. Create a Supabase project at supabase.com
 * 2. Copy the Project URL and Anon Key below.
 */

export const DB_CONFIG = {
  // Replace these with your actual Supabase credentials
  SUPABASE_URL: "https://ptvmbmtqxzkfbxijgvtl.supabase.co", 
  SUPABASE_ANON_KEY: "sb_publishable_QOOgie8Z9BAWCtgYGUNOiQ_PRvL7lmW",
  IS_DEMO_MODE: false, // Set to false once credentials are added
};

export const APP_METRICS = {
  LOG_RETENTION_COUNT: 100,
  PERFORMANCE_THRESHOLD_MS: 1000, // Warn if API takes > 1s
};
