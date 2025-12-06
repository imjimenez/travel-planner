import type { Tables, TablesInsert, TablesUpdate } from '@core/supabase/supabase.types';

/**
 * Modelo de Document (lectura desde BD)
 *
 * Representa un documento asociado a un viaje o item del itinerario.
 * Los archivos se almacenan en el bucket 'trip-documents' de Supabase Storage.
 */
export type TripDocument = Tables<'document'>;

/**
 * Modelo para crear un nuevo Document
 *
 * Se usa internamente en el servicio tras subir el archivo al storage.
 */
export type TripDocumentInsert = TablesInsert<'document'>;

/**
 * Modelo para actualizar un Document
 *
 * Actualmente no se usa (los documentos no se actualizan, solo se eliminan).
 */
export type TripDocumentUpdate = TablesUpdate<'document'>;

/**
 * Datos necesarios para subir un documento
 *
 * Se usa en la UI para enviar archivos al servicio.
 * El servicio se encarga de subirlo al storage y crear el registro en BD.
 */
export interface UploadDocumentData {
  /** ID del viaje al que pertenece el documento */
  tripId: string;

  /** Archivo a subir */
  file: File;

  /** ID del item del itinerario (opcional) */
  itineraryItemId?: string;
}

/**
 * Documento con URL pública para mostrar en la UI
 *
 * Extiende TripDocument con la URL pública del archivo
 * para facilitar la descarga y visualización.
 */
export interface TripDocumentWithUrl extends TripDocument {
  /** URL pública del documento en Supabase Storage */
  publicUrl: string;
}
