import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { inject } from '@angular/core';

@Component({
  selector: 'app-landing',
  imports: [CommonModule],
  templateUrl: './landing.html',
  styleUrl: './landing.css'
})
export class Landing {
  private router = inject(Router);

  features = [
    {
      title: 'Desarrollo Continuo',
      description: 'Accede a cursos y recursos para mantener tus habilidades a la vanguardia del mercado.',
      icon: '📚'
    },
    {
      title: 'Estrategia Personalizada',
      description: 'Crea un plan de crecimiento único, adaptado a tus metas y aspiraciones profesionales.',
      icon: '🎯'
    },
    {
      title: 'Resultados Medibles',
      description: 'Sigue tu progreso con métricas claras y demuestra el impacto de tu desarrollo.',
      icon: '📊'
    },
    {
      title: 'Comunidad de Expertos',
      description: 'Conecta con mentores y profesionales de tu industria para acelerar tu aprendizaje.',
      icon: '🤝'
    }
  ];

  steps = [
    {
      number: '01',
      title: 'Define tus Objetivos',
      description: 'Establece metas claras y ambiciosas para tu carrera profesional. ¿A dónde quieres llegar?'
    },
    {
      number: '02',
      title: 'Crea tu Plan',
      description: 'Diseñamos juntos una hoja de ruta personalizada con los pasos y habilidades que necesitas.'
    },
    {
      number: '03',
      title: 'Alcanza el Éxito',
      description: 'Ejecuta tu plan, mide tu progreso y ajusta tu estrategia para lograr un crecimiento imparable.'
    }
  ];

  navegarAAuth(): void {
    this.router.navigate(['/auth']);
  }

  scrollToSection(sectionId: string): void {
    document.getElementById(sectionId)?.scrollIntoView({ 
      behavior: 'smooth' 
    });
  }
}