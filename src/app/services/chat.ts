
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, firstValueFrom, of } from 'rxjs';
import { MensajeChat } from '../models/chat';
import { AuthService } from './auth';
import { FirestoreService } from './firestore';
import { GeminiService } from './gemini';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  
  private authService = inject(AuthService);

  // Todavía no implementados:
  private firestoreService = inject(FirestoreService);
  private geminiService = inject(GeminiService);
  
  // BehaviorSubject para mantener la lista de mensajes del chat actual
  // BehaviorSubject siempre tiene un valor inicial y emite el último valor a nuevos suscriptores
  private mensajesSubject = new BehaviorSubject<MensajeChat[]>([]);
  
  // Observable público para que los componentes puedan suscribirse a los mensajes
  public mensajes$ = this.mensajesSubject.asObservable();
  
  private cargandoHistorial = false;
  
  // Variable para controlar si el asistente está respondiendo
  private asistenteRespondiendo = new BehaviorSubject<boolean>(false);
  public asistenteRespondiendo$ = this.asistenteRespondiendo.asObservable();

  async inicializarChat(usuarioId: string): Promise<void> {
    if (this.cargandoHistorial) {
      return;
    }
    
    this.cargandoHistorial = true;
    
    try {
      this.firestoreService.obtenerMensajesUsuario(usuarioId).subscribe({
        next: (mensajes) => {
          // Actualizamos el BehaviorSubject con los mensajes obtenidos
          this.mensajesSubject.next(mensajes);
          this.cargandoHistorial = false;
        },
        error: (error) => {
          console.error('❌ Error al cargar historial:', error);
          this.cargandoHistorial = false;
          
          // En caso de error, iniciamos con una lista vacía
          this.mensajesSubject.next([]);
        }
      });
    } catch (error) {
      console.error('❌ Error al inicializar chat:', error);
      this.cargandoHistorial = false;
      this.mensajesSubject.next([]);
    }
  }

  async enviarMensaje(contenidoMensaje: string): Promise<void> {
    // Obtenemos el usuario actual
    const usuarioActual = this.authService.obtenerUsuarioActual();
    
    if (!usuarioActual) {
      console.error('❌ No hay usuario autenticado');
      throw new Error('Usuario no autenticado');
    }
    
    if (!contenidoMensaje.trim()) {
      return;
    }
    
    // Creamos el mensaje del usuario
    const mensajeUsuario: MensajeChat = {
      usuarioId: usuarioActual.uid,
      contenido: contenidoMensaje.trim(),
      fechaEnvio: new Date(),
      tipo: 'usuario',
      estado: 'enviando'
    };
    
    try {
      // PRIMERO mostramos el mensaje del usuario en la UI inmediatamente
      const mensajesDelUsuario = this.mensajesSubject.value;
      
      const nuevosMatches = [...mensajesDelUsuario, mensajeUsuario];
      this.mensajesSubject.next(nuevosMatches);
      
      // DESPUÉS intentamos guardarlo en Firestore (en background)
      try {
        await this.firestoreService.guardarMensaje(mensajeUsuario);
      } catch (firestoreError) {
        // El mensaje ya está visible, así que continuamos
      }
      
      // Indicamos que el asistente está procesando la respuesta
      this.asistenteRespondiendo.next(true);
      
      // Obtenemos el historial actual para dar contexto a ChatGPT
      const mensajesActuales = this.mensajesSubject.value;
      
      // Convertimos nuestro historial al formato que espera Gemini
      // Solo tomamos los últimos 6 mensajes para no exceder límites de tokens
      // Esto deja más espacio para respuestas más completas

      

      const historialParaGemini = this.geminiService.convertirHistorialAGemini(
        mensajesActuales.slice(-6)
      );
      
      // Enviamos el mensaje a ChatGPT y esperamos la respuesta (usando mock)
      const respuestaAsistente = await firstValueFrom(
        this.geminiService.enviarMensaje(contenidoMensaje, historialParaGemini)
      );

      
      // Creamos el mensaje con la respuesta del asistente
      const mensajeAsistente: MensajeChat = {
        usuarioId: usuarioActual.uid,
        contenido: respuestaAsistente,
        fechaEnvio: new Date(),
        tipo: 'asistente',
        estado: 'enviado'
      };
      
      // PRIMERO mostramos la respuesta en la UI inmediatamente
      const mensajesActualizados = this.mensajesSubject.value;
      
      const nuevosMatches2 = [...mensajesActualizados, mensajeAsistente];
      this.mensajesSubject.next(nuevosMatches2);
      
      // DESPUÉS intentamos guardar en Firestore (en background)
      try {
        await this.firestoreService.guardarMensaje(mensajeAsistente);
      } catch (firestoreError) {
        // El mensaje ya está visible, así que no es crítico
      }
      
    } catch (error) {
      console.error('❌ Error al procesar mensaje:', error);
      
      // En caso de error, creamos un mensaje de error del asistente
      const mensajeError: MensajeChat = {
        usuarioId: usuarioActual.uid,
        contenido: 'Lo siento, hubo un problema al procesar tu mensaje. Por favor intenta de nuevo.',
        fechaEnvio: new Date(),
        tipo: 'asistente',
        estado: 'error'
      };
      
      try {
        await this.firestoreService.guardarMensaje(mensajeError);
      } catch (saveErrorError) {
        console.error('❌ Error al guardar mensaje de error:', saveErrorError);
        // Como último recurso, mostramos el error temporalmente en la UI
        const mensajesActuales = this.mensajesSubject.value;
        this.mensajesSubject.next([...mensajesActuales, mensajeError]);
      }
      
      throw error;
      
    } finally {
      // Siempre indicamos que el asistente ya no está respondiendo
      this.asistenteRespondiendo.next(false);
    }
  }

  obtenerMensajes(): MensajeChat[] {
    return this.mensajesSubject.value;
  }

  limpiarChat(): void {
    this.mensajesSubject.next([]);
  }

  chatListo(): boolean {
    const usuarioAutenticado = !!this.authService.obtenerUsuarioActual();
    const geminiConfigurado = this.geminiService.verificarConfiguracion();
    return usuarioAutenticado && geminiConfigurado;
  }

}
