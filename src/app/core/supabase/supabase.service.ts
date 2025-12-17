import { Injectable } from "@angular/core";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase.types";

/**
 * Servicio central de Supabase
 *
 * Proporciona acceso al cliente de Supabase configurado con:
 * - Persistencia de sesión en localStorage
 * - Refresh automático de tokens
 * - Detección de sesión en URL (para OAuth callbacks)
 *
 * La configuración (URL y API Key) se inyecta mediante DI.
 */
@Injectable({
	providedIn: "root",
})
export class SupabaseService {
	// Inyecta la configuración usando el token
	readonly #SUPABASE_URL = import.meta.env.NG_APP_SUPABASE_URL;
	readonly #SUPABASE_ANON_KEY = import.meta.env.NG_APP_SUPABASE_ANON_KEY;
	private supabase: SupabaseClient<Database>;

	constructor() {
		this.supabase = createClient<Database>(
			this.#SUPABASE_URL,
			this.#SUPABASE_ANON_KEY,
			{
				auth: {
					persistSession: true,
					autoRefreshToken: true,
					detectSessionInUrl: true,
					storage: window.localStorage,
					storageKey: "supabase.auth.token",
				},
			},
		);
	}

	/**
	 * Acceso al cliente completo de Supabase
	 * Operaciones de database, storage, functions, etc.
	 */
	get client(): SupabaseClient<Database> {
		return this.supabase;
	}

	/**
	 * Acceso directo al módulo de autenticación
	 * Login, registro, OAuth, etc.
	 */
	get auth() {
		return this.supabase.auth;
	}
}
