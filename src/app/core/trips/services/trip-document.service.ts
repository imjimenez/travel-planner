import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '@core/supabase/supabase.service';
import { AuthService } from '@core/authentication/services/auth.service';
import { TripService } from './trip.service';
import type {
  TripDocument,
  UploadDocumentData,
  TripDocumentWithUrl,
} from '../models/trip-document.model';

/**
 * Servicio para gestión de documentos de viajes
 *
 * Proporciona operaciones para:
 * - Subir documentos al storage de Supabase
 * - Listar documentos por viaje
 * - Listar documentos por item del itinerario
 * - Eliminar documentos (con permisos)
 * - Renombrar documentos
 * - Obtener URLs públicas de documentos
 *
 * Storage: Los archivos se almacenan en el bucket 'trip-documents'
 * con la estructura: {tripId}/{timestamp}-{filename}
 *
 * Permisos:
 * - Cualquier miembro puede subir documentos
 * - Cualquier miembro puede ver documentos del viaje
 * - El owner del viaje puede eliminar cualquier documento
 * - Cada usuario puede eliminar solo sus propios documentos
 * - El owner y el creador pueden renombrar el documento
 */
@Injectable({
  providedIn: 'root',
})
export class TripDocumentService {
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);
  private tripService = inject(TripService);

  private readonly BUCKET_NAME = 'trip-documents';

  /**
   * Sube un documento al storage y crea el registro en BD
   *
   * Proceso:
   * 1. Verifica que el usuario es miembro del viaje
   * 2. Sube el archivo al storage con un nombre único
   * 3. Crea el registro en la tabla 'document'
   * 4. Si falla el registro, hace rollback del archivo subido
   *
   * @param data - Archivo y metadatos del documento
   * @returns Documento creado con toda su información
   * @throws Error si el usuario no es miembro o falla la subida
   *
   */
  async uploadDocument(data: UploadDocumentData): Promise<TripDocument> {
    const user = await this.authService.getAuthUser();
    if (!user) throw new Error('Usuario no autenticado');

    // Verificar que es miembro del viaje
    await this.verifyMembership(data.tripId, user.id);

    // Generar path único: {tripId}/{timestamp}-{filename}
    const timestamp = Date.now();
    const fileName = `${timestamp}-${data.file.name}`;
    const filePath = `${data.tripId}/${fileName}`;

    // Subir archivo al storage
    const { error: uploadError } = await this.supabaseService.client.storage
      .from(this.BUCKET_NAME)
      .upload(filePath, data.file);

    if (uploadError) {
      throw new Error(`Error al subir archivo: ${uploadError.message}`);
    }

    // Registrar en BD con el nombre original del archivo
    const { data: document, error: dbError } = await this.supabaseService.client
      .from('document')
      .insert({
        trip_id: data.tripId,
        itinerary_item_id: data.itineraryItemId || null,
        user_id: user.id,
        file_path: filePath,
        name: data.file.name, // Nombre original del archivo
      })
      .select()
      .single();

    if (dbError) {
      // Rollback: eliminar archivo del storage
      await this.supabaseService.client.storage.from(this.BUCKET_NAME).remove([filePath]);
      throw new Error(`Error al registrar documento: ${dbError.message}`);
    }

    return document;
  }

  /**
   * Obtiene todos los documentos de un viaje con sus URLs públicas
   *
   * Verifica que el usuario es miembro del viaje antes de devolver los documentos.
   * Los documentos se ordenan por fecha de subida (más recientes primero).
   *
   * @param tripId - ID del viaje
   * @returns Lista de documentos del viaje con URLs públicas
   * @throws Error si el usuario no es miembro
   *
   */
  async getTripDocumentsWithUrl(tripId: string): Promise<TripDocumentWithUrl[]> {
    const documents = await this.getTripDocuments(tripId);

    return documents.map((doc) => ({
      ...doc,
      publicUrl: this.getPublicUrl(doc.file_path),
    }));
  }

  /**
   * Obtiene todos los documentos de un viaje
   *
   * Verifica que el usuario es miembro del viaje antes de devolver los documentos.
   * Los documentos se ordenan por fecha de subida (más recientes primero).
   *
   * @param tripId - ID del viaje
   * @returns Lista de documentos del viaje
   * @throws Error si el usuario no es miembro
   *
   */
  async getTripDocuments(tripId: string): Promise<TripDocument[]> {
    const user = await this.authService.getAuthUser();
    if (!user) throw new Error('Usuario no autenticado');

    // Verificar que es miembro del viaje
    await this.verifyMembership(tripId, user.id);

    const { data, error } = await this.supabaseService.client
      .from('document')
      .select('*')
      .eq('trip_id', tripId)
      .order('uploaded_at', { ascending: false });

    if (error) throw new Error(`Error al obtener documentos: ${error.message}`);
    return data || [];
  }

  /**
   * Obtiene documentos filtrados por item del itinerario
   *
   * Útil para mostrar solo los documentos relacionados con una parada específica
   *
   * @param tripId - ID del viaje
   * @param itineraryItemId - ID del item del itinerario
   * @returns Documentos asociados al item
   * @throws Error si el usuario no es miembro
   *
   */
  async getDocumentsByItineraryItem(
    tripId: string,
    itineraryItemId: string
  ): Promise<TripDocument[]> {
    const user = await this.authService.getAuthUser();
    if (!user) throw new Error('Usuario no autenticado');

    // Verificar que es miembro del viaje
    await this.verifyMembership(tripId, user.id);

    const { data, error } = await this.supabaseService.client
      .from('document')
      .select('*')
      .eq('trip_id', tripId)
      .eq('itinerary_item_id', itineraryItemId)
      .order('uploaded_at', { ascending: false });

    if (error) throw new Error(`Error al obtener documentos: ${error.message}`);
    return data || [];
  }

  /**
   * Renombra un documento
   *
   * Permisos:
   * - El owner del viaje puede renombrar cualquier documento
   * - El usuario puede renombrar solo sus propios documentos
   *
   * @param documentId - ID del documento
   * @param newName - Nuevo nombre para el documento
   * @throws Error si el usuario no tiene permisos
   *
   */
  async renameDocument(documentId: string, newName: string): Promise<void> {
    const user = await this.authService.getAuthUser();
    if (!user) throw new Error('Usuario no autenticado');

    // Obtener documento
    const { data: document, error: getError } = await this.supabaseService.client
      .from('document')
      .select('trip_id, user_id')
      .eq('id', documentId)
      .single();

    if (getError || !document || !document.trip_id) {
      throw new Error('Documento no encontrado');
    }

    // Verificar permisos
    const isOwner = await this.tripService.isOwner(document.trip_id);
    const isUploader = document.user_id === user.id;

    if (!isOwner && !isUploader) {
      throw new Error('No tienes permisos para renombrar este documento');
    }

    // Actualizar nombre
    const { error: updateError } = await this.supabaseService.client
      .from('document')
      .update({ name: newName })
      .eq('id', documentId);

    if (updateError) {
      throw new Error(`Error al renombrar documento: ${updateError.message}`);
    }
  }

  /**
   * Elimina un documento del storage y de la BD
   *
   * Permisos:
   * - El owner del viaje puede eliminar cualquier documento
   * - El usuario puede eliminar solo sus propios documentos
   *
   * Proceso:
   * 1. Verifica permisos
   * 2. Elimina el archivo del storage
   * 3. Elimina el registro de la BD
   *
   * @param documentId - ID del documento a eliminar
   * @throws Error si el usuario no tiene permisos
   *
   */
  async deleteDocument(documentId: string): Promise<void> {
    const user = await this.authService.getAuthUser();
    if (!user) throw new Error('Usuario no autenticado');

    // Obtener documento
    const { data: document, error: getError } = await this.supabaseService.client
      .from('document')
      .select('trip_id, user_id, file_path')
      .eq('id', documentId)
      .single();

    if (getError || !document || !document.trip_id) {
      throw new Error('Documento no encontrado');
    }

    // Verificar permisos usando TripService
    const isOwner = await this.tripService.isOwner(document.trip_id);
    const isUploader = document.user_id === user.id;

    if (!isOwner && !isUploader) {
      throw new Error('No tienes permisos para eliminar este documento');
    }

    // Eliminar de storage
    // Nota: Existe una limitación conocida de Supabase donde remove() puede devolver
    // éxito pero no eliminar físicamente el archivo.
    const { data: storageData, error: storageError } = await this.supabaseService.client.storage
      .from(this.BUCKET_NAME)
      .remove([document.file_path]);

    if (storageError) {
      console.error('Error al eliminar archivo de storage:', {
        error: storageError,
        message: storageError.message,
        filePath: document.file_path,
      });
      throw new Error(`Error al eliminar archivo del storage: ${storageError.message}`);
    }

    // Warning: Supabase Storage puede devolver array vacío incluso si el archivo no se eliminó
    // Esto es un bug conocido con RLS policies complejas
    if (storageData && Array.isArray(storageData) && storageData.length === 0) {
      console.warn(
        'Advertencia: El archivo puede no haberse eliminado del storage (limitación de Supabase)'
      );
    }

    // Eliminar de BD solo si no hubo error de storage
    const { error: dbError } = await this.supabaseService.client
      .from('document')
      .delete()
      .eq('id', documentId);

    if (dbError) {
      console.error('Error al eliminar documento de BD:', dbError);
      throw new Error(`Error al eliminar documento: ${dbError.message}`);
    }
  }

  /**
   * Obtiene la URL pública de un documento
   *
   * Genera una URL pública que permite descargar/visualizar el documento
   * sin necesidad de autenticación adicional.
   *
   * @param filePath - Path del archivo en el storage
   * @returns URL pública del documento
   *
   */
  getPublicUrl(filePath: string): string {
    const { data } = this.supabaseService.client.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  /**
   * Obtiene información del tipo MIME del archivo
   *
   * Útil para determinar si mostrar una vista previa del documento
   *
   * @param fileName - Nombre del archivo
   * @returns Tipo MIME del archivo
   *
   */
  getMimeType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();

    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      txt: 'text/plain',
    };

    return mimeTypes[extension || ''] || 'application/octet-stream';
  }

  /**
   * Determina si un documento es una imagen
   *
   * @param fileName - Nombre del archivo
   * @returns true si es una imagen
   *
   */
  isImage(fileName: string): boolean {
    const mimeType = this.getMimeType(fileName);
    return mimeType.startsWith('image/');
  }

  /**
   * Verifica si el usuario es miembro del viaje
   *
   * @private
   * @param tripId - ID del viaje
   * @param userId - ID del usuario
   * @throws Error si el usuario no es miembro
   */
  private async verifyMembership(tripId: string, userId: string): Promise<void> {
    const { data, error } = await this.supabaseService.client
      .from('trip_user')
      .select('trip_id')
      .eq('trip_id', tripId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      throw new Error('Solo los miembros del viaje pueden realizar esta acción');
    }
  }
}
