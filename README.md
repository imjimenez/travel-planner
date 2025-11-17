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
    url: 'https://TU-PROJECT-ID.supabase.co',  // ← Reemplazar
    key: 'TU-SUPABASE-ANON-KEY'                 // ← Reemplazar
  }
};
```

**¿Dónde conseguir las credenciales?**
1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Settings → Data API
3. Copia `Project URL`
4. Settings → API Keys
5. Copia `anon public`


### 4. Ejecutar el proyecto
```bash
npm start
```

La aplicación estará disponible en [http://localhost:4200](http://localhost:4200)

## Estructura del Proyecto
```
src/app/
├── core/                    # Servicios core (auth, supabase, etc.)
│   ├── authentication/      # Sistema de autenticación
│   ├── supabase/            # Cliente de Supabase
│   └── notifications/       # Servicio de notificaciones
├── features/                # Features de negocio
│   ├── dashboard/           # Dashboard principal
│   ├── trips/               # Gestión de viajes
│   └── settings/            # Configuración de usuario
├── shared/                  # Componentes compartidos
│   ├── components/          # Componentes reutilizables
│   └── layouts/             # Layouts (dashboard-layout)
└── landing/                 # Landing page
```

## Comandos Disponibles
```bash
# Desarrollo
npm start                  # Iniciar servidor de desarrollo

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

- ✅ Autenticación (email/password + OAuth: Google, GitHub, Apple)
- ✅ Registro de usuarios con verificación de email
- ✅ Recuperación de contraseña
- ✅ Dashboard layout con sidebar
- ✅ Sistema de notificaciones (toast)
- ✅ Guards de autenticación
- ✅ Gestión de sesión con Supabase

## Próximas Funcionalidades

- 🔄 Gestión de viajes (CRUD)
- 🔄 Invitaciones a viajes
- 🔄 Gestión de gastos compartidos
- 🔄 Itinerarios
- 🔄 Documentos del viaje
- 🔄 Tareas/todos

## Contribuir

1. Crea una rama desde `main`: `git checkout -b feature/nueva-funcionalidad`
2. Realiza tus cambios y haz commits descriptivos
3. Push a tu rama: `git push origin feature/nueva-funcionalidad`
4. Crea un Pull Request en GitHub

## Notas de Seguridad

⚠️ **IMPORTANTE**: 
- Los archivos `environment.ts` y `environment.prod.ts` contienen credenciales y **NUNCA** deben subirse a Git
- Solo se suben los archivos `.example.ts` como plantilla
- Cada desarrollador debe crear sus propios archivos de configuración localmente

## Soporte

Si tienes problemas con la configuración:
1. Verifica que has copiado correctamente los archivos `.example.ts`
2. Confirma que tus credenciales de Supabase son correctas
3. Asegúrate de tener la versión correcta de Node.js (v22.20.0)
