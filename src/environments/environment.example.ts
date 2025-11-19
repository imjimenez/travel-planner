// src/environments/environment.example.ts
export const environment = {
    production: false,
    
    // Config de Supabase
    supabase: {
        url: 'https://PROJECT-ID.supabase.co', // Reemplazar PROJECT-ID
        anonKey: 'SUPABASE_ANON_KEY', // Reemplazar
    },

    // URL base de la app en producción
    appURL: 'http://localhost:4200',
    
    // Ruta donde OAuth redirigirá después de login
    oauthCallbackPath: '/auth/callback'
};