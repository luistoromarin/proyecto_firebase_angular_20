import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { AuthService } from '../services/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(): Observable<boolean> {
    return this.authService.estaAutenticado$.pipe(
      // Si no está autenticado, redirigir al login
      tap(estaAutenticado => {
        if (!estaAutenticado) {
          console.log('🚫 Acceso denegado - Usuario no autenticado');
          this.router.navigate(['/auth']);
        } else {
          console.log('✅ Acceso permitido - Usuario autenticado');
        }
      }),
      // Retornar el estado de autenticación
      map(estaAutenticado => estaAutenticado)
    );
  }
}
