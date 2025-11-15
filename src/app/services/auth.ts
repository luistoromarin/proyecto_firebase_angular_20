import { Injectable, inject } from '@angular/core';
import {
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  user,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from '@angular/fire/auth';
import { map } from 'rxjs/operators';
import { Usuario } from '../models/usuario';

@Injectable({
  // Hacemos que este servicio esté disponible en toda la aplicación
  providedIn: 'root'
})
export class AuthService {

  private auth = inject(Auth);

  // Creamos un Observable que nos permite saber si hay un usuario autenticado
  // Este Observable emite cada vez que cambia el estado de autenticación
  usuario$ = user(this.auth);

  // Observable que nos dice si el usuario está autenticado o no
  estaAutenticado$ = this.usuario$.pipe(
    // Transformamos el usuario en un boolean: true si existe, false si no
    map(usuario => !!usuario)
  );

  async iniciarSesionConGoogle(): Promise<Usuario | null> {
    try {
      // Creamos el proveedor de Google para la autenticación
      const proveedor = new GoogleAuthProvider();

      // Configuramos los scopes que queremos obtener del usuario
      proveedor.addScope('email');
      proveedor.addScope('profile');

      // Abrimos el popup de Google para autenticación
      const resultado = await signInWithPopup(this.auth, proveedor);

      const usuarioFirebase = resultado.user;

      if (usuarioFirebase) {
        const usuario: Usuario = {
          uid: usuarioFirebase.uid,
          email: usuarioFirebase.email || '',
          nombre: usuarioFirebase.displayName || 'Usuario sin nombre',
          fotoUrl: usuarioFirebase.photoURL || undefined,
          fechaCreacion: new Date(),
          ultimaConexion: new Date()
        };

        return usuario;
      }

      return null;

    } catch (error) {
      console.error('❌ Error durante la autenticación:', error);
      throw error;
    }
  }

  async cerrarSesion(): Promise<void> {
    try {
      // Usamos el método signOut de Firebase para cerrar la sesión
      await signOut(this.auth);

    } catch (error) {
      console.error('❌ Error al cerrar sesión:', error);
      throw error;
    }
  }

  obtenerUsuarioActual(): User | null {
    return this.auth.currentUser;
  }

  obtenerUidUsuario(): string | null {
    const usuario = this.obtenerUsuarioActual();
    return usuario ? usuario.uid : null;
  }

  // ========================================================================================
  // MÉTODOS DE AUTENTICACIÓN CON EMAIL Y PASSWORD
  // ========================================================================================

  /**
   * Registra un nuevo usuario con email y password
   * @param email - Email del usuario
   * @param password - Password del usuario
   * @param nombre - Nombre del usuario (opcional)
   * @returns Usuario creado o null
   */
  async registrarConEmail(email: string, password: string, nombre?: string): Promise<Usuario | null> {
    try {
      // Crear usuario con email y password
      const resultado = await createUserWithEmailAndPassword(this.auth, email, password);
      const usuarioFirebase = resultado.user;

      // Actualizar el perfil con el nombre si se proporcionó
      if (usuarioFirebase && nombre) {
        await updateProfile(usuarioFirebase, {
          displayName: nombre
        });
      }

      if (usuarioFirebase) {
        const usuario: Usuario = {
          uid: usuarioFirebase.uid,
          email: usuarioFirebase.email || email,
          nombre: nombre || usuarioFirebase.displayName || 'Usuario',
          fotoUrl: usuarioFirebase.photoURL || undefined,
          fechaCreacion: new Date(),
          ultimaConexion: new Date()
        };

        return usuario;
      }

      return null;

    } catch (error) {
      console.error('❌ Error durante el registro:', error);
      throw error;
    }
  }

  /**
   * Inicia sesión con email y password
   * @param email - Email del usuario
   * @param password - Password del usuario
   * @returns Usuario autenticado o null
   */
  async iniciarSesionConEmail(email: string, password: string): Promise<Usuario | null> {
    try {
      // Iniciar sesión con email y password
      const resultado = await signInWithEmailAndPassword(this.auth, email, password);
      const usuarioFirebase = resultado.user;

      if (usuarioFirebase) {
        const usuario: Usuario = {
          uid: usuarioFirebase.uid,
          email: usuarioFirebase.email || email,
          nombre: usuarioFirebase.displayName || 'Usuario',
          fotoUrl: usuarioFirebase.photoURL || undefined,
          fechaCreacion: new Date(), // Se sobrescribe si existe en Firestore
          ultimaConexion: new Date()
        };

        return usuario;
      }

      return null;

    } catch (error) {
      console.error('❌ Error durante el login:', error);
      throw error;
    }
  }
}
