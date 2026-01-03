import { appConfig } from './../app/app.config';
// src/environments/environment.example.ts
export const environment = {
    production: false,
    
    // Config de Supabase
    supabase: {
        url: 'https://ifnbifiohomptqiuznom.supabase.co', // Reemplazar PROJECT-ID
        anonKey: 'sb_publishable_AAnlSkgoV9DqFbKARyjB9w_UE189z1k', // Reemplazar
        // Ruta donde OAuth redirigirá después de login
    },
    oauthCallbackPath: '/auth/callback',

    resendApiKey: 'resend_apikey'
    
};