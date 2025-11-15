import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

interface PeticionGemini {
  contents: ContenteGemini[];         // Array de contenidos de la conversación
  generationConfig?: {                // Configuración opcional de generación
    maxOutputTokens?: number;         // Máximo número de tokens en la respuesta
    temperature?: number;             // Creatividad de la respuesta (0-1)
  };
  safetySettings?: SafetySetting[];   // Configuraciones de seguridad
}

interface ContenteGemini {
  role: 'user' | 'model';            // Rol del mensaje (user o model en Gemini)
  parts: PartGemini[];               // Array de partes del contenido
}

interface PartGemini {
  text: string;                      // Contenido del mensaje
}

interface SafetySetting {
  category: string;                  // Categoría de seguridad
  threshold: string;                 // Umbral de bloqueo
}

interface RespuestaGemini {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
    finishReason: string;
  }[];
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class GeminiService {

  private http = inject(HttpClient);

  private readonly apiUrl = environment.gemini.apiUrl;
  private readonly apiKey = environment.gemini.apiKey;

  enviarMensaje(mensaje: string, historialPrevio: ContenteGemini[] = []): Observable<string> {
    // Verificamos que tenemos la clave de API configurada
    if (!this.apiKey || this.apiKey === 'TU_API_KEY_DE_GEMINI') {
      console.error('❌ API Key de Gemini no configurada');
      return throwError(() => new Error('API Key de Gemini no configurada. Por favor configura tu clave en environment.ts'));
    }

    // No necesitamos headers de autorización ya que la API key va en la URL
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    // Preparamos el contenido del sistema para dar personalidad al asistente
    const mensajeSistema: ContenteGemini = {
      role: 'user',
      parts: [{
        text: `Eres un asistente virtual útil y amigable. Responde siempre en español de manera clara y concisa. 
               Eres especialista en ayudar con preguntas generales, programación, y tecnología. 
               Mantén un tono profesional pero cercano.`
      }]
    };

    const respuestaSistema: ContenteGemini = {
      role: 'model',
      parts: [{
        text: 'Entendido. Soy tu asistente virtual especializado en tecnología y programación. Te ayudaré de manera clara y profesional en español. ¿En qué puedo ayudarte?'
      }]
    };

    // Preparamos los contenidos para enviar a Gemini
    const contenidos: ContenteGemini[] = [
      mensajeSistema,
      respuestaSistema,
      // Añadimos el historial previo para mantener el contexto
      ...historialPrevio,
      // Añadimos el mensaje actual del usuario
      {
        role: 'user',
        parts: [{ text: mensaje }]
      }
    ];

    // Configuraciones de seguridad para permitir más contenido técnico
    const configuracionesSeguridad: SafetySetting[] = [
      {
        category: "HARM_CATEGORY_HARASSMENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
        threshold: "BLOCK_MEDIUM_AND_ABOVE"
      }
    ];

    // Preparamos el cuerpo de la petición según la especificación de Gemini
    const cuerposPeticion: PeticionGemini = {
      contents: contenidos,
      generationConfig: {
        maxOutputTokens: 800,         // Límite de tokens para la respuesta
        temperature: 0.7              // Creatividad moderada
      },
      safetySettings: configuracionesSeguridad
    };

    // URL completa con la API key como parámetro
    const urlCompleta = `${this.apiUrl}?key=${this.apiKey}`;

    // Hacemos la petición HTTP a la API de Gemini
    return this.http.post<RespuestaGemini>(urlCompleta, cuerposPeticion, { headers })
      .pipe(
        // Transformamos la respuesta para extraer solo el contenido del mensaje
        map(respuesta => {
          // Verificamos que la respuesta tenga el formato esperado
          if (respuesta.candidates && respuesta.candidates.length > 0) {
            const candidate = respuesta.candidates[0];
            
            if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
              let contenidoRespuesta = candidate.content.parts[0].text;

              // Verificamos si la respuesta fue truncada por límite de tokens
              if (candidate.finishReason === 'MAX_TOKENS') {
                contenidoRespuesta += '\n\n[Nota: Respuesta truncada por límite de tokens. Puedes pedirme que continúe.]';
              }

              return contenidoRespuesta;
            } else {
              throw new Error('Respuesta de Gemini no contiene contenido válido');
            }
          } else {
            throw new Error('Respuesta de Gemini no tiene el formato esperado');
          }
        }),

        // Manejamos los errores que puedan ocurrir
        catchError(error => {
          console.error('❌ Error al comunicarse con Gemini:', error);

          // Personalizamos el mensaje de error según el tipo
          let mensajeError = 'Error al conectar con Gemini';

          if (error.status === 400) {
            mensajeError = 'Petición inválida a Gemini. Verifica la configuración.';
          } else if (error.status === 403) {
            mensajeError = 'Clave de API de Gemini inválida o sin permisos';
          } else if (error.status === 429) {
            mensajeError = 'Has excedido el límite de peticiones. Intenta de nuevo más tarde.';
          } else if (error.status === 500) {
            mensajeError = 'Error en el servidor de Gemini. Intenta de nuevo más tarde.';
          } else if (error.error?.error?.message) {
            mensajeError = error.error.error.message;
          }

          return throwError(() => new Error(mensajeError));
        })
      );
  }

  /**
   * Convierte nuestro historial de mensajes al formato que espera Gemini
   * También optimiza el historial para mantener dentro de límites de tokens
   * 
   * @param mensajes - Nuestros mensajes internos
   * @returns Array de contenidos en formato Gemini
   */
  convertirHistorialAGemini(mensajes: any[]): ContenteGemini[] {
    // Convertimos los mensajes al formato de Gemini
    const historialConvertido: ContenteGemini[] = mensajes.map(msg => ({
      role: (msg.tipo === 'usuario' ? 'user' : 'model') as 'user' | 'model',
      parts: [{ text: msg.contenido }]
    }));

    // Si tenemos demasiados mensajes, priorizamos los más recientes
    // pero siempre mantenemos pares de pregunta-respuesta completos
    if (historialConvertido.length > 8) {
      // Tomamos los últimos 6 mensajes, pero asegurándonos de mantener pares
      const ultimosMensajes = historialConvertido.slice(-6);

      // Si empezamos con una respuesta del modelo, quitamos el primer mensaje
      // para mantener el contexto conversacional correcto
      if (ultimosMensajes.length > 0 && ultimosMensajes[0].role === 'model') {
        return ultimosMensajes.slice(1);
      }

      return ultimosMensajes;
    }

    return historialConvertido;
  }

  /**
   * Verifica si la API de Gemini está configurada correctamente
   * 
   * @returns true si la configuración es válida
   */
  verificarConfiguracion(): boolean {
    const configuracionValida = !!(this.apiKey && this.apiKey !== 'TU_API_KEY_DE_GEMINI' && this.apiUrl);

    return configuracionValida;
  }
}
