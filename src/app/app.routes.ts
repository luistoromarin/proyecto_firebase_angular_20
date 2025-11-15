import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth-guard';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./components/landing/landing').then(m => m.Landing),
        title: "SkillMain - Potencia tu Carrera Profesional"
    },
    {
        path: 'landing',
        loadComponent: () => import('./components/landing/landing').then(m => m.Landing),
        title: "SkillMain - Potencia tu Carrera Profesional"
    },
    {
        path: 'auth',
        loadComponent: () => import('./components/auth/auth').then(m => m.Auth),
        title: "Iniciar sesión - Chat Asistente"
    },
    {
        path: 'dashboard',
        loadComponent: () => import('./components/dashboard/dashboard').then(m => m.Dashboard),
        title: "Dashboard - Chat Asistente",
        canActivate: [AuthGuard]
    },
    {
        path: 'chat',
        loadComponent: () => import('./components/chat/chat').then(m => m.Chat),
        title: "Chat - Asistente",
        canActivate: [AuthGuard]
    },
    {
        path: '**',
        redirectTo: '/auth'
    }
];
