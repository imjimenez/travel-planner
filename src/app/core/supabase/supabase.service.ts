// src/core/supabase/supabase.service.ts
import { inject, Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from './supabase.config';
import { Database } from './supabase.types';

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
  providedIn: 'root'
})
export class SupabaseService {
  // Inyecta la configuración usando el token
  private config = inject(SUPABASE_CONFIG);
  private supabase: SupabaseClient<Database>;

  constructor() {
    this.supabase = createClient<Database>(
    this.config.url,
    this.config.anonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: window.localStorage,
          storageKey: 'supabase.auth.token',
        }
      }
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