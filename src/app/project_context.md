# Proyecto Angular 20 + Firebase - Contexto y Notas de Implementación

## Descripción General
Chat asistente desarrollado con Angular 20, Firebase Authentication, Firestore y integración con IA (Gemini/ChatGPT).

## Arquitectura del Proyecto

### Estructura de Componentes
```
src/app/
├── components/
│   ├── auth/         # Componente de autenticación
│   └── chat/         # Componente principal del chat
├── services/         # Servicios de negocio
├── models/          # Interfaces y tipos TypeScript
├── guards/          # Guards de protección de rutas
└── environments/    # Configuraciones de entorno
```

## Angular 20 - Características y Mejores Prácticas

### 1. Control Flow Syntax (@if, @for, @switch)
Angular 20 introduce una nueva sintaxis de control de flujo que reemplaza las directivas estructurales tradicionales.

#### Implementación en el Componente Auth
**Antes (Angular < 17):**
```html
<span *ngIf="!autenticando">Icono Google</span>
<span *ngIf="autenticando">Spinner</span>
<div *ngIf="mensajeError" class="error-message">{{ mensajeError }}</div>
```

**Ahora (Angular 20):**
```html
@if (!autenticando) {
  <span class="google-icon">
    <!-- SVG del icono de Google -->
  </span>
} @else {
  <span class="spinner"></span>
}

@if (mensajeError) {
  <div class="error-message">
    ❌ {{ mensajeError }}
  </div>
}
```

### 2. Standalone Components
Todos los componentes utilizan la arquitectura standalone, eliminando la necesidad de NgModule.

```typescript
@Component({
  selector: 'app-auth',
  imports: [CommonModule],  // Solo importa lo necesario
  templateUrl: './auth.html',
  styleUrl: './auth.css'    // Nueva propiedad styleUrl
})
```

### 3. Dependency Injection con inject()
Uso moderno del sistema de inyección de dependencias:

```typescript
export class Auth {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  // En lugar del constructor tradicional:
  // constructor(private authService: AuthService, private router: Router) {}
}
```

### 4. Configuración de la Aplicación (app.config.ts)
Nueva forma de configurar la aplicación sin AppModule:

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore())
  ]
};
```

## Implementación de Formularios en Angular 20

### Directivas de Control de Flujo para Formularios

#### Validación Condicional
```html
@if (formulario.get('email')?.invalid && formulario.get('email')?.touched) {
  <div class="error-message">
    @if (formulario.get('email')?.errors?.['required']) {
      <span>El email es requerido</span>
    } @else if (formulario.get('email')?.errors?.['email']) {
      <span>El formato del email no es válido</span>
    }
  </div>
}
```

#### Estados de Carga en Formularios
```html
<form [formGroup]="formulario" (ngSubmit)="enviarFormulario()">
  <input 
    type="email" 
    formControlName="email"
    [disabled]="enviando"
    placeholder="Tu email">
  
  <button 
    type="submit" 
    [disabled]="formulario.invalid || enviando"
    [class.loading]="enviando">
    
    @if (enviando) {
      <span class="spinner"></span>
      <span>Enviando...</span>
    } @else {
      <span>Enviar</span>
    }
  </button>
</form>
```

### Reactive Forms con Angular 20
```typescript
export class FormularioComponent {
  private fb = inject(FormBuilder);
  
  formulario = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    mensaje: ['', [Validators.required, Validators.maxLength(500)]]
  });
  
  enviando = signal(false);
  errores = signal<string[]>([]);
}
```

## Estados del Componente Auth

### Propiedades Reactivas
- `autenticando: boolean` - Controla el estado de carga del botón
- `mensajeError: string` - Muestra mensajes de error específicos
- Estados de error manejados:
  - `auth/popup-closed-by-user`
  - `auth/popup-blocked`
  - `auth/network-request-failed`

### Flujo de Autenticación
1. Usuario hace clic en "Continuar con Google"
2. Se activa estado de carga (`autenticando = true`)
3. Se abre popup de Google OAuth
4. Se maneja resultado (éxito/error)
5. Redirección automática a `/chat` si es exitoso
6. Se desactiva estado de carga

## Mejores Prácticas Angular 20

### 1. Uso de Signals (Preparación para el futuro)
```typescript
// Preparación para migración a signals
export class AuthComponent {
  autenticando = signal(false);
  mensajeError = signal('');
  
  async iniciarSesion() {
    this.autenticando.set(true);
    this.mensajeError.set('');
    
    try {
      // lógica de autenticación
    } catch (error) {
      this.mensajeError.set(this.obtenerMensajeError(error));
    } finally {
      this.autenticando.set(false);
    }
  }
}
```

### 2. Control de Flujo Anidado
```html
@if (usuario) {
  <div class="usuario-info">
    <img [src]="usuario.fotoUrl" [alt]="usuario.nombre">
    
    @if (usuario.esAdmin) {
      <span class="badge admin">Administrador</span>
    } @else if (usuario.esPremium) {
      <span class="badge premium">Premium</span>
    } @else {
      <span class="badge normal">Usuario</span>
    }
  </div>
} @else {
  <div class="auth-required">
    <p>Debes iniciar sesión para continuar</p>
  </div>
}
```

### 3. Bucles con @for
```html
@for (mensaje of mensajes; track mensaje.id) {
  <div class="mensaje" [class.propio]="mensaje.esPropio">
    @if (mensaje.tipo === 'texto') {
      <p>{{ mensaje.contenido }}</p>
    } @else if (mensaje.tipo === 'imagen') {
      <img [src]="mensaje.url" [alt]="mensaje.descripcion">
    }
    
    <span class="timestamp">{{ mensaje.fecha | date:'short' }}</span>
  </div>
} @empty {
  <div class="sin-mensajes">
    <p>No hay mensajes aún. ¡Comienza la conversación!</p>
  </div>
}
```

### 4. Switch Control Flow
```html
@switch (estadoConexion) {
  @case ('conectado') {
    <span class="status online">🟢 En línea</span>
  }
  @case ('desconectado') {
    <span class="status offline">🔴 Desconectado</span>
  }
  @case ('reconectando') {
    <span class="status connecting">🟡 Reconectando...</span>
  }
  @default {
    <span class="status unknown">❓ Estado desconocido</span>
  }
}
```

## Consideraciones de Performance

### 1. OnPush Change Detection
```typescript
@Component({
  selector: 'app-optimized',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ...
})
```

### 2. TrackBy Functions para @for
```html
@for (item of items; track trackByFn($index, item)) {
  <!-- contenido -->
}
```

```typescript
trackByFn(index: number, item: any): any {
  return item.id || index;
}
```

### 3. Lazy Loading de Componentes
```typescript
const routes: Routes = [
  {
    path: 'chat',
    loadComponent: () => import('./components/chat/chat').then(m => m.Chat)
  }
];
```

## Integración con Firebase

### Configuración Moderna
- Uso de `provideFirebaseApp()` en lugar de `AngularFireModule`
- Servicios standalone con `inject()`
- Observable patterns con RxJS

### Manejo de Estados de Autenticación
- `usuario$` Observable para estado del usuario
- `estaAutenticado$` Observable derivado para checks booleanos
- Redirección automática basada en estado de auth

## Notas de Migración

### De Angular < 17 a Angular 20
1. **Control Flow**: Migrar `*ngIf`, `*ngFor`, `*ngSwitch` a `@if`, `@for`, `@switch`
2. **Standalone**: Convertir módulos a componentes standalone
3. **inject()**: Reemplazar constructor DI con función `inject()`
4. **styleUrl**: Usar `styleUrl` en lugar de `styleUrls` para archivos únicos

### Beneficios de la Nueva Sintaxis
- **Mejor Tree Shaking**: Menos código bundle
- **Type Safety**: Mejor tipado en templates
- **Performance**: Optimizaciones internas de Angular
- **Legibilidad**: Sintaxis más clara y familiar

## Servicio Firestore - Refactorización a Métodos Genéricos

### Actualización Mayor: Enero 2025

El servicio `FirestoreService` ha sido completamente refactorizado para proporcionar una API genérica y reutilizable que funciona con cualquier tipo de colección en Firestore, manteniendo compatibilidad hacia atrás con los métodos específicos existentes.

### Características Principales

#### 1. Métodos Genéricos CRUD
```typescript
// Interfaces para tipado fuerte
export interface FirestoreFilter {
  field: string;
  operator: WhereFilterOp;
  value: any;
}

export interface FirestoreQueryOptions {
  filters?: FirestoreFilter[];
  orderByField?: string;
  orderDirection?: 'asc' | 'desc';
  limitCount?: number;
}

export interface FirestoreDocument {
  id?: string;
  [key: string]: any;
}
```

#### 2. Operaciones de Escritura Genéricas
```typescript
// Guardar con ID auto-generado
async guardarDocumento<T>(collectionName: string, data: T): Promise<string>

// Guardar con ID específico
async guardarDocumentoConId<T>(collectionName: string, documentId: string, data: T): Promise<void>

// Actualizar documento
async actualizarDocumento<T>(collectionName: string, documentId: string, updates: T): Promise<void>

// Eliminar documento
async eliminarDocumento(collectionName: string, documentId: string): Promise<void>
```

#### 3. Operaciones de Lectura Genéricas
```typescript
// Obtener un documento por ID
async obtenerDocumento<T>(collectionName: string, documentId: string): Promise<T | null>

// Obtener documentos con filtros
async obtenerDocumentos<T>(collectionName: string, options?: FirestoreQueryOptions): Promise<T[]>

// Listener en tiempo real
obtenerDocumentosEnTiempoReal<T>(collectionName: string, options?: FirestoreQueryOptions): Observable<T[]>
```

#### 4. Uso Práctico con Tipado
```typescript
// Ejemplo: Trabajar con usuarios
interface Usuario {
  id?: string;
  nombre: string;
  email: string;
  fechaRegistro: Date;
}

// Guardar usuario
const userId = await firestoreService.guardarDocumento<Usuario>('usuarios', {
  nombre: 'Juan Pérez',
  email: 'juan@email.com',
  fechaRegistro: new Date()
});

// Obtener usuarios con filtros
const usuariosActivos = await firestoreService.obtenerDocumentos<Usuario>('usuarios', {
  filters: [
    { field: 'activo', operator: '==', value: true },
    { field: 'fechaRegistro', operator: '>=', value: fechaInicio }
  ],
  orderByField: 'fechaRegistro',
  orderDirection: 'desc',
  limitCount: 50
});

// Escuchar cambios en tiempo real
const usuarios$ = firestoreService.obtenerDocumentosEnTiempoReal<Usuario>('usuarios', {
  filters: [{ field: 'activo', operator: '==', value: true }]
});
```

### Procesamiento Automático de Datos

#### Conversión Date ↔ Timestamp
El servicio maneja automáticamente la conversión entre objetos `Date` de JavaScript y `Timestamp` de Firestore:

```typescript
// Al guardar: Date → Timestamp
private procesarDatosParaFirestore(data: any): any {
  if (data instanceof Date) {
    return Timestamp.fromDate(data);
  }
  // Procesamiento recursivo para objetos y arrays
}

// Al leer: Timestamp → Date
private procesarDatosDeFirestore(data: any): any {
  if (data && typeof data.toDate === 'function') {
    return data.toDate();
  }
  // Procesamiento recursivo para objetos y arrays
}
```

### Validaciones y Manejo de Errores

- **Validación de datos**: Verificación de que los datos no estén vacíos
- **Manejo de ID automático**: Exclusión del campo `id` al guardar (Firestore lo maneja)
- **Logging detallado**: Mensajes informativos para debugging
- **Propagación de errores**: Manejo consistente de errores con contexto

### Compatibilidad hacia Atrás

Los métodos específicos originales se mantienen intactos:
```typescript
// Métodos específicos preservados
async guardarMensaje(mensaje: MensajeChat): Promise<void>
obtenerMensajesUsuario(usuarioId: string): Observable<MensajeChat[]>
async guardarConversacion(conversacion: ConversacionChat): Promise<void>
```

### Beneficios de la Refactorización

1. **Reutilización**: Un solo servicio para todas las colecciones
2. **Tipado fuerte**: TypeScript generics para type safety
3. **Consistencia**: API uniforme para todas las operaciones
4. **Flexibilidad**: Filtros y opciones de query configurables
5. **Mantenibilidad**: Código DRY y fácil de mantener
6. **Escalabilidad**: Fácil agregar nuevas entidades sin duplicar código

### Referencias y Utilidades

```typescript
// Obtener referencias directas para operaciones avanzadas
obtenerColeccion(collectionName: string): CollectionReference
obtenerDocumentoRef(collectionName: string, documentId: string): DocumentReference
```

Esta refactorización establece una base sólida para el crecimiento del proyecto, permitiendo trabajar con cualquier entidad de manera consistente mientras mantiene la funcionalidad específica del chat.

---

## Servicio Auth - Expansión de Métodos de Autenticación

### Actualización: Enero 2025

El servicio `AuthService` ha sido expandido para incluir autenticación con email y password, además del método existente de Google OAuth, proporcionando múltiples opciones de autenticación para los usuarios.

### Nuevas Características de Autenticación

#### 1. Registro con Email y Password
```typescript
async registrarConEmail(email: string, password: string, nombre?: string): Promise<Usuario | null>
```

**Características:**
- Crea nuevos usuarios con email y contraseña
- Actualiza automáticamente el perfil con el nombre proporcionado
- Maneja errores de Firebase Authentication de forma consistente
- Retorna un objeto `Usuario` normalizado

**Ejemplo de uso:**
```typescript
try {
  const nuevoUsuario = await authService.registrarConEmail(
    'usuario@email.com',
    'password123',
    'Juan Pérez'
  );
  
  if (nuevoUsuario) {
    console.log('Usuario registrado:', nuevoUsuario.nombre);
    // Redireccionar al dashboard o chat
  }
} catch (error) {
  // Manejar errores específicos de Firebase
  this.manejarErrorAutenticacion(error);
}
```

#### 2. Inicio de Sesión con Email y Password
```typescript
async iniciarSesionConEmail(email: string, password: string): Promise<Usuario | null>
```

**Características:**
- Autentica usuarios existentes con credenciales email/password
- Normaliza la respuesta al mismo formato que Google Auth
- Actualiza automáticamente la fecha de última conexión
- Manejo de errores unificado

**Ejemplo de uso:**
```typescript
try {
  const usuario = await authService.iniciarSesionConEmail(
    'usuario@email.com',
    'password123'
  );
  
  if (usuario) {
    console.log('Sesión iniciada para:', usuario.nombre);
    this.router.navigate(['/chat']);
  }
} catch (error) {
  this.mostrarErrorLogin(error);
}
```

### Normalización de Objetos Usuario

Todos los métodos de autenticación retornan el mismo formato de objeto `Usuario`:

```typescript
interface Usuario {
  uid: string;
  email: string;
  nombre: string;
  fotoUrl?: string;
  fechaCreacion: Date;
  ultimaConexion: Date;
}
```

**Consistencia entre métodos:**
- **Google Auth**: Obtiene datos del perfil de Google
- **Email Auth**: Usa datos proporcionados por el usuario
- **Fallbacks**: Nombres por defecto cuando no se proporcionan datos

### Manejo de Errores Unificado

Los errores de Firebase se propagan de manera consistente para ambos métodos:

```typescript
// Errores comunes de Email/Password Auth
'auth/email-already-in-use'     // Email ya registrado
'auth/weak-password'            // Contraseña débil
'auth/user-not-found'           // Usuario no existe
'auth/wrong-password'           // Contraseña incorrecta
'auth/invalid-email'            // Email inválido
'auth/too-many-requests'        // Demasiados intentos
```

### Integración con Componentes

#### Actualización del Componente Auth
```typescript
export class AuthComponent {
  // Estados reactivos para ambos métodos
  autenticandoGoogle = signal(false);
  autenticandoEmail = signal(false);
  registrando = signal(false);
  
  // Formulario para email/password
  formularioLogin = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });
  
  async iniciarSesionGoogle() {
    this.autenticandoGoogle.set(true);
    try {
      const usuario = await this.authService.iniciarSesionConGoogle();
      if (usuario) this.router.navigate(['/chat']);
    } catch (error) {
      this.manejarError(error);
    } finally {
      this.autenticandoGoogle.set(false);
    }
  }
  
  async iniciarSesionEmail() {
    if (this.formularioLogin.valid) {
      this.autenticandoEmail.set(true);
      try {
        const { email, password } = this.formularioLogin.value;
        const usuario = await this.authService.iniciarSesionConEmail(email!, password!);
        if (usuario) this.router.navigate(['/chat']);
      } catch (error) {
        this.manejarError(error);
      } finally {
        this.autenticandoEmail.set(false);
      }
    }
  }
}
```

### Template con Control Flow Syntax
```html
<!-- Opciones de autenticación -->
<div class="auth-options">
  <!-- Google Authentication -->
  <button 
    (click)="iniciarSesionGoogle()" 
    [disabled]="autenticandoGoogle() || autenticandoEmail()"
    class="btn-google">
    @if (autenticandoGoogle()) {
      <span class="spinner"></span>
    } @else {
      <span class="google-icon"></span>
    }
    Continuar con Google
  </button>
  
  <!-- Separator -->
  <div class="separator">
    <span>o</span>
  </div>
  
  <!-- Email/Password Form -->
  <form [formGroup]="formularioLogin" (ngSubmit)="iniciarSesionEmail()">
    <input 
      type="email" 
      formControlName="email"
      placeholder="Email"
      [class.error]="formularioLogin.get('email')?.invalid && formularioLogin.get('email')?.touched">
    
    <input 
      type="password" 
      formControlName="password"
      placeholder="Contraseña"
      [class.error]="formularioLogin.get('password')?.invalid && formularioLogin.get('password')?.touched">
    
    <button 
      type="submit" 
      [disabled]="formularioLogin.invalid || autenticandoEmail()"
      class="btn-email">
      @if (autenticandoEmail()) {
        <span class="spinner"></span>
        <span>Iniciando...</span>
      } @else {
        <span>Iniciar Sesión</span>
      }
    </button>
  </form>
  
  <!-- Validation Messages -->
  @if (formularioLogin.get('email')?.invalid && formularioLogin.get('email')?.touched) {
    <div class="error-message">
      @if (formularioLogin.get('email')?.errors?.['required']) {
        <span>El email es requerido</span>
      } @else if (formularioLogin.get('email')?.errors?.['email']) {
        <span>Formato de email inválido</span>
      }
    </div>
  }
</div>
```

### Beneficios de la Expansión

1. **Flexibilidad**: Los usuarios pueden elegir su método preferido de autenticación
2. **Accesibilidad**: No todos los usuarios quieren usar cuentas de Google
3. **Control**: Mayor control sobre el proceso de registro y datos del usuario
4. **Consistencia**: API unificada independientemente del método de auth
5. **Escalabilidad**: Base para agregar otros proveedores (Facebook, Twitter, etc.)

### Consideraciones de Seguridad

- **Validación del lado cliente**: Validaciones básicas en el formulario
- **Validación del servidor**: Firebase maneja las validaciones de seguridad
- **Políticas de contraseña**: Firebase enforza políticas mínimas de password
- **Rate limiting**: Firebase previene ataques de fuerza bruta automáticamente

Esta expansión mantiene la simplicidad del servicio original mientras proporciona opciones adicionales de autenticación, manteniendo la consistencia en la experiencia del usuario y la API del desenvolvedor.

---

## TODO: Mejoras Pendientes

1. **Implementar Signals**: Migrar a nuevo sistema reactivo
2. **Error Boundary**: Manejo global de errores
3. **PWA**: Funcionalidades offline
4. **Testing**: Unit tests para control flow syntax y métodos genéricos
5. **Accessibility**: Mejoras ARIA y teclado
6. **Internacionalización**: i18n para múltiples idiomas
7. **Firestore Security Rules**: Implementar reglas específicas para las nuevas operaciones genéricas
8. **Paginación**: Agregar soporte para paginación en consultas grandes
9. **Cache Local**: Implementar estrategia de cache para optimizar performance

---

*Documento creado para proyecto Angular 20 + Firebase - Chat Asistente*
*Última actualización: Enero 2025*