// src/environments/environment.prod.example.ts
export const environment = {
    production: true,
    
    // Config de Supabase
    supabase: {
        url: 'https://PROJECT-ID.supabase.co', // Reemplazar PROJECT-ID
        anonKey: 'SUPABASE_ANON_KEY', // Reemplazar
    },

    // URL base de la app en producción
    appURL: 'https://tuapp.com',
    
    // Ruta donde OAuth redirigirá después de login
    oauthCallbackPath: '/auth/callback'
};