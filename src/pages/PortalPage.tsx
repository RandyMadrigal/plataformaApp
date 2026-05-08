import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/subsanables/Header";
import { ProcessBanner } from "@/components/subsanables/ProcessBanner";
import { OferenteBar } from "@/components/subsanables/OferenteBar";
import { FileList, type UploadedFile } from "@/components/subsanables/FileList";
import { DropZone } from "@/components/subsanables/DropZone";
import { TotalSize } from "@/components/subsanables/TotalSize";

const INITIAL_SECONDS = 24 * 60 + 32;
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = ["pdf", "doc", "docx", "xls", "xlsx", "png", "jpg", "jpeg"];

const SEED_FILES: UploadedFile[] = [
  {
    id: "seed-a",
    name: "A- Documentación Legal.pdf",
    size: 3426 * 1024,
    type: "application/pdf",
    modified: new Date(2026, 3, 6, 14, 54),
    status: "success",
  },
  {
    id: "seed-b",
    name: "B- Documentación Financiera.pdf",
    size: 29110 * 1024,
    type: "application/pdf",
    modified: new Date(2026, 3, 6, 14, 55),
    status: "success",
  },
  {
    id: "seed-c",
    name: "C- Documentacion Tecnica.pdf",
    size: 44264 * 1024,
    type: "application/pdf",
    modified: new Date(2026, 3, 6, 14, 55),
    status: "success",
  },
];

export function PortalPage() {
  const [seconds, setSeconds] = useState(INITIAL_SECONDS);
  const [files, setFiles] = useState<UploadedFile[]>(SEED_FILES);
  const expired = seconds <= 0;

  useEffect(() => {
    if (expired) return;
    const id = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [expired]);

  useEffect(() => {
    if (expired) {
      toast.error("El tiempo para subsanar ha vencido.", {
        description: "Ya no es posible cargar más documentos.",
      });
    }
  }, [expired]);

  const handleFiles = useCallback(
    (list: FileList) => {
      if (expired) return;
      const accepted: UploadedFile[] = [];
      Array.from(list).forEach((file) => {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
        if (!ACCEPTED_EXTENSIONS.includes(ext)) {
          toast.error(`Tipo de archivo no permitido: ${file.name}`, {
            description: "Formatos válidos: PDF, Word, Excel, PNG, JPG.",
          });
          return;
        }
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`Archivo demasiado grande: ${file.name}`, {
            description: "El tamaño máximo es de 50 MB.",
          });
          return;
        }
        accepted.push({
          id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          modified: new Date(file.lastModified || Date.now()),
          status: "success",
        });
      });
      if (accepted.length > 0) {
        setFiles((prev) => [...prev, ...accepted]);
        toast.success(
          accepted.length === 1
            ? `Documento agregado: ${accepted[0].name}`
            : `${accepted.length} documentos agregados`,
        );
      }
    },
    [expired],
  );

  const handleRemove = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const remainingSeconds = useMemo(() => seconds, [seconds]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <ProcessBanner
        description="CONDICIONES ESPECIFICAS PARA LA CONTRATACIÓN DE LOS SERVICIOS DE SUMINISTRO DE RACIONES ALIMENTARIAS DEL ALMUERZO ESCOLAR Y SU DISTRIBUCIÓN EN LOS CENTROS EDUCATIVOS PÚBLICOS DURANTE LOS PERÍODOS ESCOLARES 2026-2027 Y 2027-2028."
        code="INABIE-CCC-LPN-2026-00XX"
        remainingSeconds={remainingSeconds}
      />
      <OferenteBar nombre="Manuel Antonio Moral Exp." rnc="XXX-XXXXX-X" />

      <main className="flex-1 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-[1.6fr_1fr] min-h-[420px]">
          <div className="max-h-[70vh] overflow-y-auto">
            <FileList files={files} onRemove={handleRemove} />
          </div>
          <div className="flex flex-col border-l border-inabie-gray-soft">
            <div className="flex-1">
              <DropZone disabled={expired} onFiles={handleFiles} />
            </div>
            <TotalSize files={files} />
          </div>
        </div>
      </main>

      <footer className="h-3 w-full bg-inabie-navy-deep" />
    </div>
  );
}
