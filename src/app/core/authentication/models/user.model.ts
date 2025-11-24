/**
 * Modelo de usuario de la aplicación
 *
 * Representa los datos principales de un usuario autenticado.
 * Este modelo es independiente de la estructura de Supabase.
 */
export interface User {
	/** ID único del usuario (UUID de Supabase) */
	id: string;

	/** Email del usuario (usado para autenticación) */
	email: string;

	/** Nombre del usuario */
	firstName?: string;

	/** Apellidos del usuario */
	lastName?: string;

	/** URL del avatar (opcional, puede venir de OAuth providers) */
	avatarURL?: string;

	/** Fecha de creación de la cuenta */
	createdAt: Date;

	/** Proveedores de autenticación usados (ej: ['email', 'google']) */
	providers?: string[];
}

/**
 * Función helper para convertir un usuario de Supabase al modelo User de la app
 *
 * Mapea los campos específicos de Supabase (user_metadata, identities, etc.)
 * a nuestro modelo User más simple y consistente.
 *
 * Separa el full_name en firstName y lastName si es posible.
 *
 * @param supabaseUser - Usuario retornado por Supabase Auth
 * @returns User - Usuario mapeado al modelo de la aplicación
 */
export function mapSupabaseUser(supabaseUser: any): User {
	// Obtener first_name y last_name de metadata (si existen)
	const firstName = supabaseUser.user_metadata?.first_name;
	const lastName = supabaseUser.user_metadata?.last_name;

	// Si tenemos first_name y last_name separados, los usamos
	if (firstName !== undefined) {
		return {
			id: supabaseUser.id,
			email: supabaseUser.email,
			firstName,
			lastName: lastName || undefined,
			avatarURL: supabaseUser.user_metadata?.avatar_url,
			createdAt: new Date(supabaseUser.created_at),
			providers: supabaseUser.identities?.map((i: any) => i.provider) || [
				"email",
			],
		};
	}

	// Fallback: Si solo tenemos full_name (OAuth)
	// Lo guardamos todo como firstName
	const fullName = supabaseUser.user_metadata?.full_name || "";

	return {
		id: supabaseUser.id,
		email: supabaseUser.email,
		firstName: fullName || undefined,
		lastName: undefined,
		avatarURL: supabaseUser.user_metadata?.avatar_url,
		createdAt: new Date(supabaseUser.created_at),
		providers: supabaseUser.identities?.map((i: any) => i.provider) || [
			"email",
		],
	};
}

/**
 * Obtiene el nombre completo del usuario
 *
 * @param user - Usuario
 * @returns Nombre completo
 */
export function getFullName(user: User): string {
	if (user.firstName && user.lastName) {
		return `${user.firstName} ${user.lastName}`;
	}
	return user.firstName || "Usuario";
}

/**
 * Obtiene las iniciales del usuario para mostrar en el avatar
 *
 * Si solo hay firstName (ej: "Juan José"), toma la primera letra
 * Si hay firstName y lastName, toma la primera de cada uno
 *
 * @param user - Usuario
 * @returns Iniciales (ej: "J" para "Juan José", "JP" para "Juan Pérez")
 */
export function getUserInitials(user: User): string {
	if (user.firstName && user.lastName) {
		return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
	}
	if (user.firstName) {
		return user.firstName[0].toUpperCase();
	}
	return user.email[0].toUpperCase();
}
