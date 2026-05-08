import type { UploadedFile } from "./FileList";

interface TotalSizeProps {
  files: UploadedFile[];
}

export function TotalSize({ files }: TotalSizeProps) {
  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
  const totalMb = totalBytes / (1024 * 1024);
  const formatted = totalMb.toLocaleString("es-DO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="px-6 py-4 border-t border-inabie-gray-soft bg-inabie-gray-soft/30 flex items-center justify-between text-sm">
      <span className="text-muted-foreground">
        Total cargado ({files.length} {files.length === 1 ? "archivo" : "archivos"})
      </span>
      <span className="font-semibold text-inabie-navy tabular-nums">
        {formatted} MB
      </span>
    </div>
  );
}