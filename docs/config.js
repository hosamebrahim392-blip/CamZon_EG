/**
 * CamZone-EG Configuration File
 * Real-time Supabase and Platform Configuration for GitHub Pages & Cloud deployment
 */
window.__CAMZONE_CONFIG__ = {
  // Supabase Project URL (CamZone-EG Production)
  SUPABASE_URL: "https://qlzgcwmdaiverqrbmmah.supabase.co",
  
  // Confirmed Client Anon Key for Row Level Security (RLS) queries
  SUPABASE_ANON_KEY: window.__CAMZONE_CONFIG__?.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsemdjd21kYWl2ZXJxcmJtbWFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk4NTYwMDAsImV4cCI6MjAyNTQzMjAwMH0.sample_anon_key",

  // GitHub Pages and App Base Path
  BASE_URL: "/CamZon_EG/",
  APP_NAME: "CamZone-EG",
  APP_VERSION: "2.5.0",
  DEFAULT_GOVERNORATE: "Cairo",
};
