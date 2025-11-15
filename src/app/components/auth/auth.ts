import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { FirestoreService } from '../../services/firestore';

@Component({
  selector: 'app-auth',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './auth.html',
  styleUrl: './auth.css'
})
export class Auth implements OnInit {

  private authService = inject(AuthService);
  private firestoreService = inject(FirestoreService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  // Estados reactivos
  autenticandoGoogle = signal(false);
  autenticandoEmail = signal(false);
  registrando = signal(false);
  mensajeError = signal('');
  mensajeExito = signal('');
  modoRegistro = signal(false);

  // Formularios
  formularioLogin = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  formularioRegistro = this.fb.group({
    // Campos obligatorios
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmarPassword: ['', [Validators.required]],
    // Campos opcionales
    genero: [''],
    edad: ['', [Validators.min(13), Validators.max(120)]],
    situacionLaboral: ['']
  }, { validators: this.validarPasswordsCoinciden });

  async iniciarSesionConGoogle(): Promise<void> {
    this.limpiarMensajes();
    this.autenticandoGoogle.set(true);
    
    try {
      const usuario = await this.authService.iniciarSesionConGoogle();
     
      if (usuario) {
        // Guardar información del usuario en Firestore
        await this.guardarUsuarioEnFirestore(usuario);
        await this.router.navigate(['/dashboard']);
      } else {
        this.mensajeError.set('No se pudo obtener la información del usuario');
      }
      
    } catch (error: any) {
      console.error('❌ Error durante la autenticación:', error);
      this.manejarErrorAutenticacion(error);
    } finally {
      this.autenticandoGoogle.set(false);
    }
  }

  async iniciarSesionConEmail(): Promise<void> {
    if (this.formularioLogin.valid) {
      this.limpiarMensajes();
      this.autenticandoEmail.set(true);

      try {
        const { email, password } = this.formularioLogin.value;
        const usuario = await this.authService.iniciarSesionConEmail(email!, password!);

        if (usuario) {
          await this.router.navigate(['/dashboard']);
        } else {
          this.mensajeError.set('No se pudo iniciar sesión');
        }

      } catch (error: any) {
        console.error('❌ Error durante el login:', error);
        this.manejarErrorAutenticacion(error);
      } finally {
        this.autenticandoEmail.set(false);
      }
    }
  }

  async registrarUsuario(): Promise<void> {
    if (this.formularioRegistro.valid) {
      this.limpiarMensajes();
      this.registrando.set(true);

      try {
        const formData = this.formularioRegistro.value;
        const usuario = await this.authService.registrarConEmail(
          formData.email!,
          formData.password!,
          formData.nombre!
        );

        if (usuario) {
          // Agregar campos opcionales al usuario
          const usuarioCompleto = {
            ...usuario,
            genero: formData.genero || undefined,
            edad: formData.edad ? Number(formData.edad) : undefined,
            situacionLaboral: formData.situacionLaboral || undefined
          };

          // Guardar en Firestore
          await this.guardarUsuarioEnFirestore(usuarioCompleto);
          
          this.mensajeExito.set('Usuario registrado exitosamente. Redirigiendo...');
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 2000);
        }

      } catch (error: any) {
        console.error('❌ Error durante el registro:', error);
        this.manejarErrorAutenticacion(error);
      } finally {
        this.registrando.set(false);
      }
    }
  }

  private async guardarUsuarioEnFirestore(usuario: any): Promise<void> {
    try {
      const usuarioExistente = await this.firestoreService.obtenerDocumento('usuarios', usuario.uid);
      
      if (!usuarioExistente) {
        await this.firestoreService.guardarDocumentoConId('usuarios', usuario.uid, usuario);
        console.log('✅ Usuario guardado en Firestore');
      } else {
        // Actualizar última conexión
        await this.firestoreService.actualizarDocumento('usuarios', usuario.uid, {
          ultimaConexion: new Date()
        });
        console.log('✅ Última conexión actualizada');
      }
    } catch (error) {
      console.error('❌ Error al guardar usuario en Firestore:', error);
    }
  }

  private manejarErrorAutenticacion(error: any): void {
    const errores: { [key: string]: string } = {
      'auth/popup-closed-by-user': 'Has cerrado la ventana de autenticación. Intenta de nuevo.',
      'auth/popup-blocked': 'Tu navegador bloqueó la ventana de autenticación. Permite popups y vuelve a intentar.',
      'auth/network-request-failed': 'Error de conexión. Verifica tu internet y vuelve a intentar.',
      'auth/email-already-in-use': 'Este email ya está registrado. Intenta iniciar sesión.',
      'auth/weak-password': 'La contraseña es demasiado débil. Debe tener al menos 6 caracteres.',
      'auth/user-not-found': 'No existe una cuenta con este email.',
      'auth/wrong-password': 'Contraseña incorrecta.',
      'auth/invalid-email': 'El formato del email no es válido.',
      'auth/too-many-requests': 'Demasiados intentos fallidos. Espera un momento e intenta de nuevo.'
    };

    this.mensajeError.set(errores[error.code] || 'Error al procesar la solicitud. Por favor intenta de nuevo.');
  }

  private validarPasswordsCoinciden(control: any): { [key: string]: any } | null {
    const password = control.get('password');
    const confirmarPassword = control.get('confirmarPassword');

    if (password && confirmarPassword && password.value !== confirmarPassword.value) {
      return { passwordsNoCoinciden: true };
    }
    return null;
  }

  cambiarModo(): void {
    this.modoRegistro.set(!this.modoRegistro());
    this.limpiarMensajes();
    this.formularioLogin.reset();
    this.formularioRegistro.reset();
  }

  private limpiarMensajes(): void {
    this.mensajeError.set('');
    this.mensajeExito.set('');
  }

  ngOnInit(): void {
    this.authService.estaAutenticado$.subscribe(autenticado => {
      if (autenticado) {
        this.router.navigate(['/dashboard']);
      }
    });
  }
}
