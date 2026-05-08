import { FileText } from "lucide-react";
import { useRef, useState, type DragEvent, type ChangeEvent } from "react";

interface DropZoneProps {
  disabled: boolean;
  onFiles: (files: FileList) => void;
}

export function DropZone({ disabled, onFiles }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = (e: DragEvent<HTMLDivElement>, dragging: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsDragging(dragging);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFiles(e.target.files);
      e.target.value = "";
    }
  };

  return (
    <div
      onDragEnter={(e) => handleDrag(e, true)}
      onDragOver={(e) => handleDrag(e, true)}
      onDragLeave={(e) => handleDrag(e, false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      className={[
        /* ✅ STICKY REAL */
        "sticky top-0 z-40 bg-white",

        /* ✅ Layout (sin h-full) */
        "flex flex-col items-center justify-center gap-4",
        "min-h-[320px] px-6 py-10 text-center transition-all",
        "border-l border-inabie-gray-soft cursor-pointer select-none",

        disabled
          ? "opacity-50 cursor-not-allowed bg-inabie-gray-soft/30"
          : isDragging
          ? "bg-inabie-navy/5 ring-2 ring-inabie-navy/40 ring-inset"
          : "hover:bg-inabie-gray-soft/30",
      ].join(" ")}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />

      <FileText className="h-20 w-20 text-inabie-gray" strokeWidth={1.2} />

      <p className="text-lg md:text-xl text-muted-foreground max-w-xs leading-snug">
        {disabled
          ? "Tiempo agotado. Carga deshabilitada."
          : "Arrastre y suelta tus documentos aquí."}
      </p>

      {!disabled && (
        <p className="text-xs text-muted-foreground">
          PDF, Word, Excel o imágenes — máx. 50&nbsp;MB
        </p>
      )}

    </div>
    
    

  );
}