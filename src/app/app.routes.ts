import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth-guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: '/auth',
        pathMatch: 'full'
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
