// src/environments/environment.prod.example.ts
export const environment = {
	production: true,

	// Config de Supabase
	supabase: {
		url: "https://PROJECT-ID.supabase.co", // Reemplazar PROJECT-ID
		anonKey: "SUPABASE_ANON_KEY", // Reemplazar
		oauthCallbackPath: "/auth/callback", // Ruta donde OAuth redirigirá después de login
	},
};
