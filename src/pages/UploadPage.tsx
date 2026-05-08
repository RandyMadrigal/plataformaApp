import { useEffect, useMemo, useState, useCallback, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { Header } from "@/components/subsanables/Header";
import { ProcessBanner } from "@/components/subsanables/ProcessBanner";
import { OferenteBar } from "@/components/subsanables/OferenteBar";
import { FileList, type UploadedFile } from "@/components/subsanables/FileList";
import { DropZone } from "@/components/subsanables/DropZone";
import { TotalSize } from "@/components/subsanables/TotalSize";

import {
  findOferente,
  findProceso,
  getNotifByToken,
  guardarCarga,
  marcarAccedida,
  segundosRestantes,
  type DocumentoSubido,
} from "@/lib/rpm-store";

const MAX = 50 * 1024 * 1024;
const EXTS = ["pdf", "doc", "docx", "xls", "xlsx", "png", "jpg", "jpeg", "zip"];

export function UploadPage() {
  const { token } = useParams<{ token: string }>();

  // Re-render trigger when DB changes (after marcarAccedida)
  const [tick, setTick] = useState(0);

  const notif = useMemo(() => getNotifByToken(token ?? ""), [token, tick]);

  useEffect(() => {
    if (notif) marcarAccedida(token ?? "");
    setTick((t) => t + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const proceso = notif ? findProceso(notif.proceso_id) : undefined;
  const oferente = notif ? findOferente(notif.oferente_id) : undefined;

  const [files, setFiles] = useState<{ file: File; meta: DocumentoSubido }[]>([]);

  // Countdown timer driven from notif.fecha_limite
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() =>
    notif ? segundosRestantes(notif) : 0,
  );

  useEffect(() => {
    if (!notif) return;
    setRemainingSeconds(segundosRestantes(notif));
    const id = setInterval(() => {
      const secs = segundosRestantes(notif);
      setRemainingSeconds(secs);
      if (secs <= 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [notif]);

  const expired = remainingSeconds <= 0;

  // Invalid token
  if (!notif || !proceso || !oferente) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
        <div className="max-w-md text-center bg-white border rounded-lg p-8 shadow-sm">
          <h1 className="text-xl font-bold">Enlace inválido o expirado</h1>
          <p className="text-sm text-muted-foreground mt-2">
            El enlace que intenta usar no es válido. Solicite uno nuevo al administrador.
          </p>
          <Link to="/" className="inline-block mt-4 text-sm text-inabie-navy underline">
            Ir al inicio
          </Link>
        </div>
      </div>
    );
  }

  const acceptFiles = useCallback(
    (list: FileList) => {
      if (expired) return;
      const next: typeof files = [];
      Array.from(list).forEach((f) => {
        const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
        if (!EXTS.includes(ext)) {
          toast.error(`Tipo de archivo no permitido: ${f.name}`, {
            description: "Formatos válidos: PDF, Word, Excel, PNG, JPG y ZIP.",
          });
          return;
        }
        if (f.size > MAX) {
          toast.error(`Archivo demasiado grande: ${f.name}`, {
            description: "El tamaño máximo es de 50 MB.",
          });
          return;
        }
        next.push({
          file: f,
          meta: {
            id: `${f.name}-${f.size}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            nombre_archivo: f.name,
            size: f.size,
            tipo: f.type || ext,
            fecha_subida: new Date().toISOString(),
          },
        });
      });
      if (next.length > 0) {
        setFiles((prev) => [...prev, ...next]);
        toast.success(
          next.length === 1
            ? `Documento agregado: ${next[0].meta.nombre_archivo}`
            : `${next.length} documentos agregados`,
        );
      }
    },
    [expired, files],
  );

  const handleRemove = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.meta.id !== id));
    toast.success("Documento eliminado.");
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      toast.error("Debe cargar al menos un documento.");
      return;
    }
    guardarCarga(token ?? "", files.map((f) => f.meta));
    toast.success("Documentación enviada correctamente.");
  };

  const uploadedFiles: UploadedFile[] = files.map((f) => ({
    id: f.meta.id,
    name: f.meta.nombre_archivo,
    size: f.meta.size,
    type: f.meta.tipo,
    modified: new Date(f.meta.fecha_subida),
    status: "success",
  }));

  return (
    <div className="h-screen bg-background flex flex-col">
      <Header />

      <ProcessBanner
        description={proceso.nombre}
        code={proceso.codigo}
        remainingSeconds={remainingSeconds}
      />

      <OferenteBar nombre={oferente.nombre} rnc={oferente.rnc ?? ""} />

      <main className="flex-1 bg-white">
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-[1.6fr_1fr] h-full min-h-[420px]"
        >
          {/* File list */}
          <div className="h-full overflow-hidden">
            <FileList files={uploadedFiles} onRemove={handleRemove} />
          </div>

          {/* Sidebar */}
          <div className="sticky top-0 self-start z-40 bg-white">
            <DropZone disabled={expired} onFiles={acceptFiles} />
            <TotalSize files={uploadedFiles} />

            <div className="p-6 border-t border-inabie-gray-soft space-y-4">
              <Button
                type="submit"
                disabled={expired}
                className="w-full bg-inabie-navy hover:bg-inabie-navy-deep text-white"
              >
                Enviar documentación
              </Button>
            </div>
          </div>
        </form>
      </main>

      <footer className="h-3 w-full bg-inabie-navy-deep" />
    </div>
  );
}

