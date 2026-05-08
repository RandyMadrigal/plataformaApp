import { useEffect, useState } from "react";

export type EstadoNotif =
  | "pendiente"
  | "enviada"
  | "accedio"
  | "completada"
  | "expirada";

export interface Proceso {
  id: string;
  codigo: string;
  nombre: string;
  fecha_creacion: string;
}

export interface Oferente {
  id: string;
  nombre: string;
  correo: string;
  telefono?: string;
  rnc?: string;
}

export interface DocumentoSubido {
  id: string;
  nombre_archivo: string;
  size: number;
  tipo: string;
  fecha_subida: string;
}

export interface FormularioOferente {
  empresa: string;
  rnc: string;
  contacto: string;
  correo: string;
  telefono: string;
}

export interface Notificacion {
  id: string;
  proceso_id: string;
  oferente_id: string;
  token: string;
  fecha_envio: string;
  fecha_limite: string;
  estado: EstadoNotif;
  fecha_acceso?: string;
  fecha_carga?: string;
  documentos: DocumentoSubido[];
  formulario?: FormularioOferente;
}

interface DB {
  procesos: Proceso[];
  oferentes: Oferente[];
  notificaciones: Notificacion[];
}

const KEY = "rpm-db-v1";

const SEED: DB = {
  procesos: [
    { id: "p1", codigo: "INABIE-LPN-2026-0001", nombre: "Suministro de raciones alimentarias 2026-2027", fecha_creacion: new Date().toISOString() },
    { id: "p2", codigo: "INABIE-LPN-2026-0002", nombre: "Suministro de raciones alimentarias 2026-2027 prueba", fecha_creacion: new Date().toISOString() },
    { id: "p3", codigo: "INABIE-LPN-2026-0003", nombre: "Suministro de raciones alimentarias 2026-2027 prueba 2", fecha_creacion: new Date().toISOString() },
  ],
  oferentes: [
    { id: "01", nombre: "Comercial ABC SRL", correo: "abc@gmail.com", rnc: "131-12345-1" },
    { id: "02", nombre: "Soluciones XYZ", correo: "xyz@gmail.com", rnc: "131-22222-2" },
    { id: "03", nombre: "Tecnología Global", correo: "tech@gmail.com", rnc: "131-33333-3" },
    { id: "04", nombre: "Angel Suero", correo: "suero@gmail.com", rnc: "001-00000-4" },
    { id: "05", nombre: "Josue Cubilete", correo: "Cubilete@gmail.com", rnc: "001-00000-5" },
  ],
  notificaciones: [],
};

function read(): DB {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      window.localStorage.setItem(KEY, JSON.stringify(SEED));
      return SEED;
    }
    const db = JSON.parse(raw) as DB;
    let mutated = false;
    db.notificaciones?.forEach((n) => {
      if (!n.fecha_limite) {
        n.fecha_limite = new Date(
          new Date(n.fecha_envio).getTime() + 24 * 60 * 60 * 1000,
        ).toISOString();
        mutated = true;
      }
    });
    if (mutated) window.localStorage.setItem(KEY, JSON.stringify(db));
    return db;
  } catch {
    return SEED;
  }
}

function write(db: DB) {
  window.localStorage.setItem(KEY, JSON.stringify(db));
  window.dispatchEvent(new Event("rpm-db-change"));
}

export function useDb() {
  const [db, setDb] = useState<DB>(() => read());
  useEffect(() => {
    const onChange = () => setDb(read());
    window.addEventListener("rpm-db-change", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("rpm-db-change", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  return db;
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function crearNotificacion(
  proceso_id: string,
  oferente_id: string,
  duracionMs: number = DURACION_MS,
): Notificacion {
  const db = read();
  const ahora = new Date();
  const limite = new Date(ahora.getTime() + duracionMs);

  const existingIndex = db.notificaciones.findIndex(
    (n) => n.proceso_id === proceso_id && n.oferente_id === oferente_id,
  );

  if (existingIndex !== -1) {
    // Re-send: refresh token, dates and reset state — keep existing documents
    const existing = db.notificaciones[existingIndex];
    const updated: Notificacion = {
      ...existing,
      token: uid() + uid(),
      fecha_envio: ahora.toISOString(),
      fecha_limite: limite.toISOString(),
      estado: "enviada",
      fecha_acceso: undefined,
      fecha_carga: undefined,
    };
    db.notificaciones[existingIndex] = updated;
    write(db);
    return updated;
  }

  const notif: Notificacion = {
    id: uid(),
    proceso_id,
    oferente_id,
    token: uid() + uid(),
    fecha_envio: ahora.toISOString(),
    fecha_limite: limite.toISOString(),
    estado: "enviada",
    documentos: [],
  };
  db.notificaciones.push(notif);
  write(db);
  return notif;
}

// Duración por defecto de la ventana de subsanación (24 horas)
export const DURACION_MS = 24 * 60 * 60 * 1000;

export function segundosRestantes(notif: Notificacion): number {
  const ms = new Date(notif.fecha_limite).getTime() - Date.now();
  return Math.max(0, Math.floor(ms / 1000));
}

export function getNotifByToken(token: string): Notificacion | undefined {
  return read().notificaciones.find((n) => n.token === token);
}

export function marcarAccedida(token: string) {
  const db = read();
  const n = db.notificaciones.find((x) => x.token === token);
  if (!n) return;
  if (!n.fecha_acceso) n.fecha_acceso = new Date().toISOString();
  if (n.estado === "enviada") n.estado = "accedio";
  write(db);
}

export function guardarCarga(
  token: string,
  documentos: DocumentoSubido[],
) {
  const db = read();
  const n = db.notificaciones.find((x) => x.token === token);
  if (!n) return;
 
  n.documentos = documentos;
  n.fecha_carga = new Date().toISOString();
  n.estado = "completada";
  write(db);
}

export function agregarDocumentos(token: string, docs: DocumentoSubido[]) {
  const db = read();
  const n = db.notificaciones.find((x) => x.token === token);
  if (!n) return;
  if (segundosRestantes(n) <= 0) return;
  n.documentos = [...n.documentos, ...docs];
  n.fecha_carga = new Date().toISOString();
  n.estado = "completada";
  write(db);
}

export function eliminarDocumento(token: string, docId: string) {
  const db = read();
  const n = db.notificaciones.find((x) => x.token === token);
  if (!n) return;
  if (segundosRestantes(n) <= 0) return;
  n.documentos = n.documentos.filter((d) => d.id !== docId);
  write(db);
}

export function findProceso(id: string) {
  return read().procesos.find((p) => p.id === id);
}
export function findOferente(id: string) {
  return read().oferentes.find((o) => o.id === id);
}

export const ESTADO_LABEL: Record<EstadoNotif, string> = {
  pendiente: "Pendiente",
  enviada: "Notificación enviada",
  accedio: "Accedió al enlace",
  completada: "Documentación cargada",
  expirada: "Expirado",
};