import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot,
  QuerySnapshot,
  DocumentData,
  Timestamp
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { ConversacionChat, MensajeChat } from '../models/chat';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  private firestore = inject(Firestore);


  async guardarMensaje(mensaje: MensajeChat): Promise<void> {
    try {
      if (!mensaje.usuarioId) {
        throw new Error('usuarioId es requerido');
      }
      if (!mensaje.contenido) {
        throw new Error('contenido es requerido');
      }
      if (!mensaje.tipo) {
        throw new Error('tipo es requerido');
      }
      
      // Obtenemos la referencia a la colección 'mensajes'
      const coleccionMensajes = collection(this.firestore, 'mensajes');
      
      // Preparamos el mensaje para guardarlo, convirtiendo la fecha a Timestamp de Firebase
      const mensajeParaGuardar = {
        usuarioId: mensaje.usuarioId,
        contenido: mensaje.contenido,
        tipo: mensaje.tipo,
        estado: mensaje.estado || 'enviado',
        // Firebase requiere usar Timestamp en lugar de Date
        fechaEnvio: Timestamp.fromDate(mensaje.fechaEnvio)
      };
      
      // Añadimos el documento a la colección
      const docRef = await addDoc(coleccionMensajes, mensajeParaGuardar);
      
    } catch (error: any) {
      console.error('❌ Error al guardar mensaje en Firestore:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      throw error;
    }
  }

  obtenerMensajesUsuario(usuarioId: string): Observable<MensajeChat[]> {
    return new Observable(observer => {
      // Creamos una consulta para obtener solo los mensajes del usuario especificado
      // NOTA: Removemos temporalmente orderBy para evitar el problema del índice
      const consulta = query(
        collection(this.firestore, 'mensajes'),
        // Filtramos por el ID del usuario
        where('usuarioId', '==', usuarioId)
      );

      // Configuramos el listener en tiempo real
      const unsubscribe = onSnapshot(
        consulta,
        (snapshot: QuerySnapshot<DocumentData>) => {
          // Transformamos los documentos de Firestore en nuestros objetos MensajeChat
          const mensajes: MensajeChat[] = snapshot.docs.map(doc => {
            const data = doc.data();
            
            return {
              id: doc.id,
              usuarioId: data['usuarioId'],
              contenido: data['contenido'],
              tipo: data['tipo'],
              estado: data['estado'],
              // Convertimos el Timestamp de Firebase de vuelta a Date
              fechaEnvio: data['fechaEnvio'].toDate()
            } as MensajeChat;
          });
          
          // ORDENAMOS en el cliente ya que removimos orderBy de la query
          mensajes.sort((a, b) => a.fechaEnvio.getTime() - b.fechaEnvio.getTime());
          
          // Emitimos los mensajes a través del Observable
          observer.next(mensajes);
        },
        error => {
          console.error('❌ Error al escuchar mensajes:', error);
          observer.error(error);
        }
      );

      // Función de limpieza que se ejecuta cuando se cancela la suscripción
      return () => {
        unsubscribe();
      };
    });
  }


  async guardarConversacion(conversacion: ConversacionChat): Promise<void> {
    try {
      const coleccionConversaciones = collection(this.firestore, 'conversaciones');
      
      // Preparamos la conversación, convirtiendo las fechas a Timestamps
      const conversacionParaGuardar = {
        ...conversacion,
        fechaCreacion: Timestamp.fromDate(conversacion.fechaCreacion),
        ultimaActividad: Timestamp.fromDate(conversacion.ultimaActividad),
        // También convertimos las fechas de los mensajes
        mensajes: conversacion.mensajes.map(mensaje => ({
          ...mensaje,
          fechaEnvio: Timestamp.fromDate(mensaje.fechaEnvio)
        }))
      };
      
      await addDoc(coleccionConversaciones, conversacionParaGuardar);
      
    } catch (error) {
      console.error('❌ Error al guardar conversación:', error);
      throw error;
    }
  }

}
