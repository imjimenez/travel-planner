// Producción
export const environment = {
    production: false,
    supabaseURL: 'https://PROJECT-ID.supabase.co', // Reemplazar PROJECT-ID
    supabaseKey: 'SUPABASE_ANON_KEY', // Reemplazar

    // URL base de la app en producción
    appURL: 'https://tuapp.com',
    
    // Ruta donde OAuth redirigirá después de login
    oauthCallbackPath: '/auth/callback'
}