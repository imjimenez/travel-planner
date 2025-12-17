
declare interface Env {
  readonly NODE_ENV: string;
  NG_APP_SUPABASE_URL: string;
  NG_APP_SUPABASE_ANON_KEY: string;
  NG_APP_RESEND_API_KEY: string;
}

declare interface ImportMeta {
  readonly env: Env;
}
