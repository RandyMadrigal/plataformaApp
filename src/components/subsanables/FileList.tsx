import { FileText, X } from "lucide-react";

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  modified: Date;
  status: "success" | "error";
  error?: string;
}

interface FileListProps {
  files: UploadedFile[];
  onRemove: (id: string) => void;
}

function formatSize(bytes: number) {
  const kb = bytes / 1024;
  return `${kb.toLocaleString("es-DO", { maximumFractionDigits: 0 })} KB`;
}

function formatDate(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
}

function describeType(file: UploadedFile) {
  const ext = file.name.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf":
      return "Adobe Acrobat D...";
    case "doc":
    case "docx":
      return "Microsoft Word D...";
    case "xls":
    case "xlsx":
      return "Microsoft Excel D...";
    case "png":
    case "jpg":
    case "jpeg":
      return "Imagen";
    default:
      return ext ? ext.toUpperCase() : "Archivo";
  }
}

export function FileList({ files, onRemove }: FileListProps) {
  if (files.length === 0) {
    return (
      <div className="px-6 py-10 text-sm text-muted-foreground">
        Aún no se han cargado documentos.
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <table className="w-full text-sm sticky top-0">
        <thead className="text-muted-foreground border-b border-inabie-gray-soft sticky top-0 bg-white z-10 ">
          <tr className="text-left">
            <th className="font-normal py-2 pl-6 pr-2 w-[40%]">Nombre</th>
            <th className="font-normal py-2 px-2">Fecha de modificación</th>
            <th className="font-normal py-2 px-2">Tipo</th>
            <th className="font-normal py-2 px-2">Tamaño</th>
            <th className="font-normal py-2 px-2 w-12">Estado</th>
            <th className="py-2 pr-6 w-10"></th>
          </tr>
        </thead>

        <tbody>
          {files.map((f) => (
            <tr
              key={f.id}
              className="border-b border-inabie-gray-soft/60 hover:bg-inabie-gray-soft/40 transition-colors"
            >
              <td className="py-2.5 pl-6 pr-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-inabie-red shrink-0" />
                  <span className="truncate text-foreground">{f.name}</span>
                </div>
              </td>

              <td className="py-2.5 px-2 text-muted-foreground whitespace-nowrap">
                {formatDate(f.modified)}
              </td>

              <td className="py-2.5 px-2 text-muted-foreground whitespace-nowrap">
                {describeType(f)}
              </td>

              <td className="py-2.5 px-2 text-muted-foreground whitespace-nowrap">
                {formatSize(f.size)}
              </td>

              <td className="py-2.5 px-2">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{
                    backgroundColor:
                      f.status === "success"
                        ? "var(--status-success)"
                        : "var(--status-error)",
                  }}
                  title={f.status === "success" ? "Cargado" : f.error ?? "Error"}
                  aria-label={
                    f.status === "success"
                      ? "Cargado correctamente"
                      : f.error ?? "Error"
                  }
                />
              </td>

              <td className="py-2.5 pr-6">
                <button
                  onClick={() => onRemove(f.id)}
                  className="text-muted-foreground hover:text-inabie-red transition-colors"
                  aria-label={`Eliminar ${f.name}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}