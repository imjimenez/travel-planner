// supabase.client.ts
import { createClient } from "@supabase/supabase-js";
import { environment } from "../../../environments/environment";
import { Database } from "./supabase.types";

/**
 * Cliente único de Supabase para toda la aplicación
 * 
 * Este cliente se inicializa una sola vez y se reutiliza en toda la app.
 * Maneja automáticamente:
 * - Refresh de tokens cuando expiran
 * - Almacenamiento de sesión en localStorage
 * - Estado de autenticación (onAuthStateChange)
 * 
 * IMPORTANTE: No crear múltiples instancias del cliente.
 * Usar siempre esta exportación.
 */
export const supabaseClient = createClient<Database>(
    environment.supabaseURL,
    environment.supabaseKey
)