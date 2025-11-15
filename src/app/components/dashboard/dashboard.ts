import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { Usuario } from '../../models/usuario';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  usuario: Usuario | null = null;

  ngOnInit() {
    this.authService.usuario$.subscribe(user => {
      if (user) {
        this.usuario = {
          uid: user.uid,
          email: user.email || '',
          nombre: user.displayName || 'Usuario',
          fotoUrl: user.photoURL || undefined,
          fechaCreacion: new Date(),
          ultimaConexion: new Date()
        };
      } else {
        this.router.navigate(['/auth']);
      }
    });
  }

  async cerrarSesion() {
    try {
      await this.authService.cerrarSesion();
      this.router.navigate(['/auth']);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }
}