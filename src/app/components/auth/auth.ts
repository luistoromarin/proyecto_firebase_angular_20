import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-auth',
  imports: [CommonModule],
  templateUrl: './auth.html',
  styleUrl: './auth.css'
})
export class Auth {

  private authService = inject(AuthService);
  private router = inject(Router);
  autenticando = false;
  mensajeError = '';

  async iniciarSesionConGoogle(): Promise<void> {
    this.mensajeError = '';
    this.autenticando = true;
    
    try {
      const usuario = await this.authService.iniciarSesionConGoogle();
     
      if (usuario) {
        await this.router.navigate(['/chat']);
        
      } else {
        this.mensajeError = 'No se pudo obtener la información del usuario';
        console.error('❌ No se obtuvo información del usuario');
      }
      
    } catch (error: any) {
      console.error('❌ Error durante la autenticación:', error);
      
      if (error.code === 'auth/popup-closed-by-user') {
        this.mensajeError = 'Has cerrado la ventana de autenticación. Intenta de nuevo.';
      } else if (error.code === 'auth/popup-blocked') {
        this.mensajeError = 'Tu navegador bloqueó la ventana de autenticación. Permite popups y vuelve a intentar.';
      } else if (error.code === 'auth/network-request-failed') {
        this.mensajeError = 'Error de conexión. Verifica tu internet y vuelve a intentar.';
      } else {
        this.mensajeError = 'Error al iniciar sesión. Por favor intenta de nuevo.';
      }
      
    } finally {
      this.autenticando = false;
    }
  }

  ngOnInit(): void {
    this.authService.estaAutenticado$.subscribe(autenticado => {
      if (autenticado) {
        this.router.navigate(['/chat']);
      }
    });
  }
}
