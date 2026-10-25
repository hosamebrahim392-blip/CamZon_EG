/**
 * Application Configuration & Supabase Client Settings
 * Supports runtime window.__CAMZONE_CONFIG__, Vite env variables, and safe defaults.
 */

export interface CamZoneConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  baseUrl: string;
  appName: string;
  version: string;
}

declare global {
  interface Window {
    __CAMZONE_CONFIG__?: {
      SUPABASE_URL?: string;
      SUPABASE_ANON_KEY?: string;
      BASE_URL?: string;
      APP_NAME?: string;
      APP_VERSION?: string;
      DEFAULT_GOVERNORATE?: string;
    };
  }
}

const runtimeConfig = typeof window !== 'undefined' ? window.__CAMZONE_CONFIG__ : undefined;

export const APP_CONFIG: CamZoneConfig = {
  supabaseUrl:
    runtimeConfig?.SUPABASE_URL ||
    import.meta.env.VITE_SUPABASE_URL ||
    'https://qlzgcwmdaiverqrbmmah.supabase.co',
  supabaseAnonKey:
    runtimeConfig?.SUPABASE_ANON_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsemdjd21kYWl2ZXJxcmJtbWFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk4NTYwMDAsImV4cCI6MjAyNTQzMjAwMH0.sample_anon_key',
  baseUrl: runtimeConfig?.BASE_URL || import.meta.env.BASE_URL || '/CamZon_EG/',
  appName: runtimeConfig?.APP_NAME || 'CamZone-EG',
  version: runtimeConfig?.APP_VERSION || '2.4.0',
};
