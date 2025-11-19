// src/app/core/supabase/supabase.config.ts
import { InjectionToken } from '@angular/core';

/**
 * Interfaz para la configuración de Supabase
 */
export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

/**
 * Token de inyección para la configuración de Supabase
 * 
 * Este token permite a Angular inyectar la configuración
 * en cualquier servicio que la necesite usando inject() o
 * en el constructor.
 * 
 * @example
 * // En un servicio:
 * private config = inject(SUPABASE_CONFIG);
 */
export const SUPABASE_CONFIG = new InjectionToken<SupabaseConfig>('supabase.config');