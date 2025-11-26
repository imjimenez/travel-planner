# Travel Planner
Aplicación para planificación colaborativa de viajes con gestión de itinerarios, gastos compartidos, documentos y tareas.

## Tecnologías

- **Frontend**: Angular 19
- **Backend**: Supabase (Auth, Database, Storage)
- **Lenguaje**: TypeScript
- **Estilos**: TailwindCSS

## Requisitos

- Node.js v22.20.0
- npm v10.9.3
- Git

## Configuración Inicial

### 1. Clonar el repositorio
```bash
git clone git@github.com:imjimenez/travel-planner.git
cd travel-planner
```
### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno

Los archivos de configuración con credenciales reales **NO** están en el repositorio por seguridad. Debes crearlos localmente:
```bash
# Copiar los archivos de ejemplo
cp src/environments/environment.example.ts src/environments/environment.ts
cp src/environments/environment.prod.example.ts src/environments/environment.prod.ts
```

Luego edita `src/environments/environment.ts` y añade tus credenciales de Supabase:
```typescript
export const environment = {
  production: false,
  supabase: {
    url: 'https://TU-PROJECT-ID.supabase.co',    // Reemplazar
    anonKey: 'TU-SUPABASE-ANON-KEY'              // Reemplazar
  },
  resendApiKey:'RESEND_API_KEY',
  appURL: 'http://localhost:4200',
  oauthCallbackPath: '/auth/callback'
};
```

Y `src/environments/environment.prod.ts` para producción:
```typescript
export const environment = {
  production: true,
  supabase: {
    url: 'https://TU-PROJECT-ID.supabase.co',    // Reemplazar
    anonKey: 'TU-SUPABASE-ANON-KEY'              // Reemplazar
  },
  resendApiKey:'RESEND_API_KEY',
  appURL: 'https://tuapp.com',                   // URL de producción
  oauthCallbackPath: '/auth/callback',

};
```

**¿Dónde conseguir las credenciales?**
1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Settings → API → Project URL (copia la URL)
3. Settings → API → Project API keys → `anon` `public` (copia la key)
4. Ve a [Resend Dashboard - Api Keys](https://resend.com/api-keys) y copia la key Travel planner web

### 4. Ejecutar el proyecto
```bash
npm start
```

La aplicación estará disponible en [http://localhost:4200](http://localhost:4200)

## Estructura del Proyecto
```
src/app/
├── core/                         # Servicios core y configuración
│   ├── authentication/           # Sistema completo de autenticación
│   │   ├── guards/               # Guards de protección de rutas
│   │   ├── interceptors/         # HTTP interceptor para tokens
│   │   ├── models/               # Modelos de auth (User, Session, etc.)
│   │   ├── pages/                # Páginas de auth (login, register, etc.)
│   │   ├── providers/            # Configuración OAuth providers
│   │   └── services/             # AuthService
│   ├── supabase/                 # Cliente de Supabase con DI
│   │   ├── supabase.config.ts    # Configuración con InjectionToken
│   │   ├── supabase.service.ts   # Servicio del cliente
│   │   └── supabase.types.ts     # Tipos generados de la DB
│   └── notifications/            # Servicio de notificaciones
├── features/                     # Features de negocio
│   ├── dashboard/                # Dashboard principal
│   ├── trips/                    # Gestión de viajes (próximamente)
│   └── settings/                 # Configuración de usuario (próximamente)
├── shared/                       # Componentes compartidos
│   ├── components/               # Componentes reutilizables
│   └── layouts/                  # Layouts (dashboard-layout)
├── landing/                      # Landing page
└── app.config.ts                 # Configuración global con providers
```

## Arquitectura de Autenticación

El sistema de autenticación usa **Dependency Injection** para inyectar la configuración de Supabase:
```typescript
// app.config.ts
{
  provide: SUPABASE_CONFIG,
  useValue: environment.supabase  // Configuración inyectada
}
```

Esto permite:
- Tests más fáciles (inyectar configuración mock)
- Mayor flexibilidad (cambiar config sin tocar servicios)
- Mejor separación de responsabilidades

## Comandos Disponibles
```bash
# Desarrollo
npm start                 # Iniciar servidor de desarrollo

# Build
npm run build             # Build para producción
npm run build:dev         # Build para desarrollo

# Tests (pendiente)
npm test                  # Ejecutar tests
npm run test:coverage     # Tests con coverage

# Linting
npm run lint              # Ejecutar ESLint
```

## Funcionalidades Implementadas

### Autenticación completa
- Login/registro con email y password
- OAuth (Google, GitHub)
- Recuperación de contraseña
- Eliminación de cuenta
- Gestión automática de tokens (refresh)
- HTTP Interceptor para añadir tokens automáticamente
- Guards de protección de rutas
- Manejo de errores

### UI Base
- Dashboard layout con sidebar
- Sistema de notificaciones (toast)
- Landing page

## Próximas Funcionalidades

- Gestión de viajes (CRUD)
- Invitaciones a viajes
- Gestión de gastos compartidos
- Itinerarios
- Documentos del viaje
- Tareas/todos

## Contribuir

1. Crea una rama desde `main`: `git checkout -b feature/nueva-funcionalidad`
2. Realiza tus cambios y haz commits descriptivos
3. Push a tu rama: `git push origin feature/nueva-funcionalidad`
4. Crea un Pull Request en GitHub

## Notas de Seguridad

**IMPORTANTE**: 
- Los archivos `environment.ts` y `environment.prod.ts` contienen credenciales y **NUNCA** deben subirse a Git
- Solo se suben los archivos `.example.ts` como plantilla
- Cada desarrollador debe crear sus propios archivos de configuración localmente
- El `.gitignore` ya está configurado para ignorar estos archivos

## Soporte

Si tienes problemas con la configuración:
1. Verifica que has copiado correctamente los archivos `.example.ts`
2. Confirma que tus credenciales de Supabase son correctas
3. Asegúrate de tener la versión correcta de Node.js (v22.20.0)
