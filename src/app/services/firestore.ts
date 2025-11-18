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
  Timestamp,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  orderBy,
  limit,
  WhereFilterOp,
  DocumentReference,
  CollectionReference
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { ConversacionChat, MensajeChat } from '../models/chat';

// Interfaces para operaciones genéricas
export interface FirestoreFilter {
  field: string;
  operator: WhereFilterOp;
  value: any;
}

export interface FirestoreQueryOptions {
  filters?: FirestoreFilter[];
  orderByField?: string;
  orderDirection?: 'asc' | 'desc';
  limitCount?: number;
}

export interface FirestoreDocument {
  id?: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {
  private firestore = inject(Firestore);

  // ========================================================================================
  // MÉTODOS GENÉRICOS PARA CUALQUIER COLECCIÓN Y TIPO DE OBJETO
  // ========================================================================================

  /**
   * Guarda un documento en cualquier colección con ID auto-generado
   * @param collectionName - Nombre de la colección
   * @param data - Objeto a guardar
   * @returns Promise con el ID del documento creado
   */
  async guardarDocumento<T extends FirestoreDocument>(
    collectionName: string,
    data: T
  ): Promise<string> {
    try {
      this.validarDatos(data);

      const coleccion = collection(this.firestore, collectionName);
      const dataParaGuardar = this.procesarDatosParaFirestore(data);

      const docRef = await addDoc(coleccion, dataParaGuardar);

      console.log(`✅ Documento guardado en ${collectionName} con ID:`, docRef.id);
      return docRef.id;

    } catch (error: any) {
      console.error(`❌ Error al guardar documento en ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Guarda un documento con un ID específico
   * @param collectionName - Nombre de la colección
   * @param documentId - ID específico para el documento
   * @param data - Objeto a guardar
   */
  async guardarDocumentoConId<T extends FirestoreDocument>(
    collectionName: string,
    documentId: string,
    data: T
  ): Promise<void> {
    try {
      this.validarDatos(data);

      const docRef = doc(this.firestore, collectionName, documentId);
      const dataParaGuardar = this.procesarDatosParaFirestore(data);

      await setDoc(docRef, dataParaGuardar);

      console.log(`✅ Documento guardado en ${collectionName} con ID personalizado:`, documentId);

    } catch (error: any) {
      console.error(`❌ Error al guardar documento con ID en ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene un documento específico por su ID
   * @param collectionName - Nombre de la colección
   * @param documentId - ID del documento
   * @returns Documento o null si no existe
   */
  async obtenerDocumento<T extends FirestoreDocument>(
    collectionName: string,
    documentId: string
  ): Promise<T | null> {
    try {
      const docRef = doc(this.firestore, collectionName, documentId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...this.procesarDatosDeFirestore(data)
        } as T;
      } else {
        console.log(`📭 No se encontró documento en ${collectionName} con ID:`, documentId);
        return null;
      }

    } catch (error: any) {
      console.error(`❌ Error al obtener documento de ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene documentos con filtros y opciones
   * @param collectionName - Nombre de la colección
   * @param options - Opciones de filtrado y ordenamiento
   * @returns Array de documentos
   */
  async obtenerDocumentos<T extends FirestoreDocument>(
    collectionName: string,
    options: FirestoreQueryOptions = {}
  ): Promise<T[]> {
    try {
      let consulta: any = collection(this.firestore, collectionName);

      // Aplicar filtros
      if (options.filters && options.filters.length > 0) {
        for (const filter of options.filters) {
          consulta = query(consulta, where(filter.field, filter.operator, filter.value));
        }
      }

      // Aplicar ordenamiento
      if (options.orderByField) {
        const direction = options.orderDirection || 'asc';
        consulta = query(consulta, orderBy(options.orderByField, direction));
      }

      // Aplicar límite
      if (options.limitCount) {
        consulta = query(consulta, limit(options.limitCount));
      }

      const querySnapshot = await getDocs(consulta);

      const documentos: T[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...this.procesarDatosDeFirestore(doc.data())
      } as T));

      console.log(`✅ Obtenidos ${documentos.length} documentos de ${collectionName}`);
      return documentos;

    } catch (error: any) {
      console.error(`❌ Error al obtener documentos de ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Escucha cambios en tiempo real de una colección
   * @param collectionName - Nombre de la colección
   * @param options - Opciones de filtrado y ordenamiento
   * @returns Observable con los documentos
   */
  obtenerDocumentosEnTiempoReal<T extends FirestoreDocument>(
    collectionName: string,
    options: FirestoreQueryOptions = {}
  ): Observable<T[]> {
    return new Observable(observer => {
      try {
        let consulta: any = collection(this.firestore, collectionName);

        // Aplicar filtros
        if (options.filters && options.filters.length > 0) {
          for (const filter of options.filters) {
            consulta = query(consulta, where(filter.field, filter.operator, filter.value));
          }
        }

        // Aplicar ordenamiento
        if (options.orderByField) {
          const direction = options.orderDirection || 'asc';
          consulta = query(consulta, orderBy(options.orderByField, direction));
        }

        // Aplicar límite
        if (options.limitCount) {
          consulta = query(consulta, limit(options.limitCount));
        }

        const unsubscribe = onSnapshot(
          consulta,
          (snapshot: QuerySnapshot<DocumentData>) => {
            const documentos: T[] = snapshot.docs.map(doc => ({
              id: doc.id,
              ...this.procesarDatosDeFirestore(doc.data())
            } as T));

            observer.next(documentos);
          },
          error => {
            console.error(`❌ Error en listener de ${collectionName}:`, error);
            observer.error(error);
          }
        );

        return () => unsubscribe();

      } catch (error) {
        console.error(`❌ Error al configurar listener de ${collectionName}:`, error);
        observer.error(error);
        // Retornar función vacía en caso de error para satisfacer TypeScript
        return () => { };
      }
    });
  }

  /**
   * Actualiza un documento específico
   * @param collectionName - Nombre de la colección
   * @param documentId - ID del documento
   * @param updates - Campos a actualizar
   */
  async actualizarDocumento<T extends Partial<FirestoreDocument>>(
    collectionName: string,
    documentId: string,
    updates: T
  ): Promise<void> {
    try {
      const docRef = doc(this.firestore, collectionName, documentId);
      const updatesParaGuardar = this.procesarDatosParaFirestore(updates);

      await updateDoc(docRef, updatesParaGuardar);

      console.log(`✅ Documento actualizado en ${collectionName}:`, documentId);

    } catch (error: any) {
      console.error(`❌ Error al actualizar documento en ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Elimina un documento específico
   * @param collectionName - Nombre de la colección
   * @param documentId - ID del documento a eliminar
   */
  async eliminarDocumento(collectionName: string, documentId: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, collectionName, documentId);
      await deleteDoc(docRef);

      console.log(`✅ Documento eliminado de ${collectionName}:`, documentId);

    } catch (error: any) {
      console.error(`❌ Error al eliminar documento de ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene una referencia a una colección
   * @param collectionName - Nombre de la colección
   * @returns Referencia a la colección
   */
  obtenerColeccion(collectionName: string): CollectionReference {
    return collection(this.firestore, collectionName);
  }

  /**
   * Obtiene una referencia a un documento
   * @param collectionName - Nombre de la colección
   * @param documentId - ID del documento
   * @returns Referencia al documento
   */
  obtenerDocumentoRef(collectionName: string, documentId: string): DocumentReference {
    return doc(this.firestore, collectionName, documentId);
  }

  // ========================================================================================
  // MÉTODOS AUXILIARES PRIVADOS
  // ========================================================================================

  /**
   * Procesa datos para guardar en Firestore (Date → Timestamp)
   * @param data - Datos a procesar
   * @returns Datos procesados para Firestore
   */
  private procesarDatosParaFirestore(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    if (data instanceof Date) {
      return Timestamp.fromDate(data);
    }

    if (Array.isArray(data)) {
      return data.map(item => this.procesarDatosParaFirestore(item));
    }

    if (typeof data === 'object') {
      const resultado: any = {};
      for (const [key, value] of Object.entries(data)) {
        // Excluir el campo id si existe, ya que Firestore lo maneja automáticamente
        if (key !== 'id') {
          resultado[key] = this.procesarDatosParaFirestore(value);
        }
      }
      return resultado;
    }

    return data;
  }

  /**
   * Procesa datos obtenidos de Firestore (Timestamp → Date)
   * @param data - Datos de Firestore
   * @returns Datos procesados para la aplicación
   */
  private procesarDatosDeFirestore(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    // Verificar si es un Timestamp de Firebase
    if (data && typeof data.toDate === 'function') {
      return data.toDate();
    }

    if (Array.isArray(data)) {
      return data.map(item => this.procesarDatosDeFirestore(item));
    }

    if (typeof data === 'object') {
      const resultado: any = {};
      for (const [key, value] of Object.entries(data)) {
        resultado[key] = this.procesarDatosDeFirestore(value);
      }
      return resultado;
    }

    return data;
  }

  /**
   * Valida que los datos no estén vacíos
   * @param data - Datos a validar
   */
  private validarDatos(data: any): void {
    if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
      throw new Error('Los datos no pueden estar vacíos');
    }
  }

  // ========================================================================================
  // MÉTODOS ESPECÍFICOS ORIGINALES (COMPATIBILIDAD HACIA ATRÁS) /
  // ========================================================================================


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
