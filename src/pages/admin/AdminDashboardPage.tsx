import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Send,
  Copy,
  Mail,
  FileText,
  Users,
  CheckCircle2,
  Clock,
  Search,
  X,
  ChevronDown,
  Timer,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  crearNotificacion,
  useDb,
  ESTADO_LABEL,
  type Proceso,
} from "@/lib/rpm-store";

import previewImg from "@/assets/preview.png";

// ─── Duration helpers ─────────────────────────────────────────────────────────

interface DurationConfig {
  days: number;
  hours: number;
  minutes: number;
}

function durationToMs({ days, hours, minutes }: DurationConfig) {
  return ((days * 24 + hours) * 60 + minutes) * 60 * 1000;
}

function formatDuration({ days, hours, minutes }: DurationConfig) {
  const parts: string[] = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  return parts.length ? parts.join(" ") : "0m";
}

function DurationPicker({
  value,
  onChange,
}: {
  value: DurationConfig;
  onChange: (v: DurationConfig) => void;
}) {
  const set = (field: keyof DurationConfig, raw: string) => {
    const n = Math.max(0, parseInt(raw) || 0);
    const capped =
      field === "hours"
        ? Math.min(n, 23)
        : field === "minutes"
          ? Math.min(n, 59)
          : n;
    onChange({ ...value, [field]: capped });
  };

  return (
    <div className="flex items-center gap-2">
      {(["days", "hours", "minutes"] as const).map((field, i) => (
        <div key={field} className="flex items-center gap-2">
          {i > 0 && (
            <span className="text-muted-foreground font-bold pb-4">:</span>
          )}
          <div className="flex flex-col items-center">
            <Input
              type="number"
              min={0}
              max={
                field === "hours" ? 23 : field === "minutes" ? 59 : undefined
              }
              value={value[field]}
              onChange={(e) => set(field, e.target.value)}
              className="w-16 text-center h-8 text-sm"
            />
            <span className="text-[10px] text-muted-foreground mt-0.5">
              {field === "days"
                ? "días"
                : field === "hours"
                  ? "horas"
                  : "minutos"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Email preview type ───────────────────────────────────────────────────────

interface EmailEntry {
  proceso: Proceso;
  oferenteNombre: string;
  correo: string;
  url: string;
}

// ─── Main component ───────────────────────────────────────────────────────────

const DEFAULT_DURATION: DurationConfig = { days: 1, hours: 0, minutes: 0 };

export function AdminDashboardPage() {
  const db = useDb();

  const [procesoId, setProcesoId] = useState<string | null>(
    db.procesos[0]?.id ?? null,
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [durationOverrides, setDurationOverrides] = useState<
    Map<string, DurationConfig>
  >(new Map());
  const [globalDuration, setGlobalDuration] =
    useState<DurationConfig>(DEFAULT_DURATION);
  const [globalDurationOpen, setGlobalDurationOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [emailPreviews, setEmailPreviews] = useState<EmailEntry[] | null>(null);

  const proceso = useMemo(
    () => db.procesos.find((p) => p.id === procesoId) ?? null,
    [db, procesoId],
  );

  const stats = useMemo(() => {
    const enviadas = db.notificaciones.length;
    const accedidos = db.notificaciones.filter((n) => n.fecha_acceso).length;
    const completadas = db.notificaciones.filter(
      (n) => n.estado === "completada",
    ).length;
    return { enviadas, accedidos, completadas };
  }, [db]);

  const filteredOferentes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return db.oferentes;
    return db.oferentes.filter(
      (o) =>
        o.nombre.toLowerCase().includes(q) ||
        o.correo.toLowerCase().includes(q) ||
        (o.rnc ?? "").toLowerCase().includes(q),
    );
  }, [db.oferentes, search]);

  const allFilteredSelected =
    filteredOferentes.length > 0 &&
    filteredOferentes.every((o) => selectedIds.has(o.id));
  const someFilteredSelected =
    filteredOferentes.some((o) => selectedIds.has(o.id)) &&
    !allFilteredSelected;

  const toggleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filteredOferentes.forEach((o) => next.delete(o.id));
      } else {
        filteredOferentes.forEach((o) => next.add(o.id));
      }
      return next;
    });
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getDuration = (oid: string): DurationConfig =>
    durationOverrides.get(oid) ?? globalDuration;

  const setDurationOverride = (oid: string, d: DurationConfig) =>
    setDurationOverrides((prev) => new Map(prev).set(oid, d));

  const clearDurationOverride = (oid: string) =>
    setDurationOverrides((prev) => {
      const next = new Map(prev);
      next.delete(oid);
      return next;
    });

  const handleEnviar = () => {
    if (!proceso || selectedIds.size === 0) return;
    const entries: EmailEntry[] = [];
    selectedIds.forEach((oid) => {
      const oferente = db.oferentes.find((o) => o.id === oid);
      if (!oferente) return;
      const notif = crearNotificacion(
        proceso.id,
        oferente.id,
        durationToMs(getDuration(oid)),
      );
      entries.push({
        proceso,
        oferenteNombre: oferente.nombre,
        correo: oferente.correo,
        url: `${window.location.origin}/upload/${notif.token}`,
      });
    });
    setEmailPreviews(entries);
    toast.success(
      entries.length === 1
        ? `Notificación enviada a ${entries[0].correo}`
        : `${entries.length} notificaciones enviadas`,
    );
  };

  // ------------- Preview Image-----------------

  const [showPreview, setShowPreview] = useState(false);

  const handlePreviewImg = () => {
    setShowPreview(true);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold tracking-tight">
          Dashboard administrativo
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Selecciona un proceso, filtra y elige oferentes, configura el tiempo y
          envía.
        </p>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={FileText} label="Procesos" value={db.procesos.length} />
        <StatCard icon={Mail} label="Correos enviados" value={stats.enviadas} />
        <StatCard icon={Users} label="Accedieron" value={stats.accedidos} />
        <StatCard
          icon={CheckCircle2}
          label="Completadas"
          value={stats.completadas}
        />
      </section>

      {/* Procesos */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Procesos disponibles
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {db.procesos.map((p) => {
            const active = p.id === procesoId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setProcesoId(p.id);
                  setSelectedIds(new Set());
                  setDurationOverrides(new Map());
                }}
                className={[
                  "text-left rounded-lg border p-4 transition-all bg-white",
                  active
                    ? "border-inabie-navy ring-2 ring-inabie-navy/30 shadow-sm"
                    : "border-border hover:border-inabie-navy/40",
                ].join(" ")}
              >
                <p className="text-xs font-mono text-inabie-navy">{p.codigo}</p>
                <p className="text-sm font-medium mt-1 leading-snug">
                  {p.nombre}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Oferentes table */}
      {proceso && (
        <section className="bg-white border rounded-lg overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">Oferentes — {proceso.codigo}</h2>
                <p className="text-xs text-muted-foreground">
                  {selectedIds.size === 0
                    ? "Selecciona uno o más oferentes para enviar notificaciones"
                    : `${selectedIds.size} oferente${selectedIds.size > 1 ? "s" : ""} seleccionado${selectedIds.size > 1 ? "s" : ""}`}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Global duration */}
                <Popover
                  open={globalDurationOpen}
                  onOpenChange={setGlobalDurationOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs h-8"
                    >
                      <Timer className="h-3.5 w-3.5" />
                      Tiempo general:{" "}
                      <span className="font-semibold">
                        {formatDuration(globalDuration)}
                      </span>
                      <ChevronDown className="h-3 w-3 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-4" align="end">
                    <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                      Tiempo de expiración por defecto
                    </p>
                    <DurationPicker
                      value={globalDuration}
                      onChange={setGlobalDuration}
                    />
                    <p className="text-xs text-muted-foreground mt-3 max-w-[220px]">
                      Se aplica a todos los oferentes que no tengan un tiempo
                      individual configurado.
                    </p>
                  </PopoverContent>
                </Popover>

                {/* Clear selection */}
                {selectedIds.size > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-xs text-muted-foreground h-8"
                    onClick={() => {
                      setSelectedIds(new Set());
                      setDurationOverrides(new Map());
                    }}
                  >
                    <X className="h-3.5 w-3.5" /> Limpiar
                  </Button>
                )}

                {/* Send */}
                <Button
                  onClick={handleEnviar}
                  disabled={selectedIds.size === 0}
                  className="bg-inabie-navy hover:bg-inabie-navy-deep text-white gap-1.5 h-8"
                >
                  <Send className="h-4 w-4" />
                  {selectedIds.size > 1
                    ? `Enviar ${selectedIds.size} notificaciones`
                    : "Enviar notificación"}
                </Button>
              </div>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Buscar por nombre, correo o RNC…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20">
                <TableHead className="w-10 pl-4">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someFilteredSelected;
                    }}
                    onChange={toggleAll}
                    className="accent-inabie-navy h-4 w-4 cursor-pointer"
                    aria-label="Seleccionar todos"
                  />
                </TableHead>
                <TableHead>Oferente</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>RNC</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-center w-36">Tiempo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOferentes.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-10"
                  >
                    <Search className="h-6 w-6 mx-auto mb-2 opacity-30" />
                    No se encontraron oferentes con "{search}"
                  </TableCell>
                </TableRow>
              )}

              {filteredOferentes.map((o) => {
                const notif = db.notificaciones.find(
                  (n) => n.proceso_id === proceso.id && n.oferente_id === o.id,
                );
                const estado = notif ? ESTADO_LABEL[notif.estado] : "Pendiente";
                const isSelected = selectedIds.has(o.id);
                const hasOverride = durationOverrides.has(o.id);
                const dur = getDuration(o.id);

                return (
                  <TableRow
                    key={o.id}
                    onClick={() => toggleOne(o.id)}
                    className={[
                      "cursor-pointer select-none transition-colors",
                      isSelected ? "bg-inabie-navy/5" : "hover:bg-muted/20",
                    ].join(" ")}
                  >
                    {/* Checkbox */}
                    <TableCell
                      className="pl-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOne(o.id)}
                        className="accent-inabie-navy h-4 w-4 cursor-pointer"
                      />
                    </TableCell>

                    <TableCell className="font-medium">{o.nombre}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {o.correo}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {o.rnc ?? "—"}
                    </TableCell>

                    {/* Estado */}
                    <TableCell>
                      <span
                        className={[
                          "inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full",
                          notif?.estado === "completada"
                            ? "bg-status-success/10 text-status-success"
                            : notif?.estado === "accedio"
                              ? "bg-inabie-navy/10 text-inabie-navy"
                              : notif?.estado === "enviada"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-muted text-muted-foreground",
                        ].join(" ")}
                      >
                        {notif?.estado === "completada" ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                        {estado}
                      </span>
                    </TableCell>

                    {/* Duration picker */}
                    <TableCell
                      className="text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={hasOverride ? "default" : "outline"}
                            size="sm"
                            className={[
                              "gap-1 text-xs h-7 px-2 font-normal",
                              hasOverride
                                ? "bg-inabie-navy text-white hover:bg-inabie-navy-deep border-inabie-navy"
                                : "text-muted-foreground",
                            ].join(" ")}
                          >
                            <Timer className="h-3 w-3 shrink-0" />
                            {hasOverride ? formatDuration(dur) : "General"}
                            <ChevronDown className="h-2.5 w-2.5 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-4" align="center">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                              Tiempo individual
                            </p>
                            {hasOverride && (
                              <button
                                onClick={() => clearDurationOverride(o.id)}
                                className="text-[10px] text-muted-foreground hover:text-destructive underline ml-4"
                              >
                                Usar general
                              </button>
                            )}
                          </div>
                          <DurationPicker
                            value={dur}
                            onChange={(d) => setDurationOverride(o.id, d)}
                          />
                          <p className="text-xs text-muted-foreground mt-2">
                            General: {formatDuration(globalDuration)}
                          </p>
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Table footer */}
          {filteredOferentes.length > 0 && (
            <div className="px-4 py-2 border-t bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {filteredOferentes.length} de {db.oferentes.length} oferente
                {db.oferentes.length !== 1 ? "s" : ""}
                {search && ` · "${search}"`}
              </span>
              {selectedIds.size > 0 && (
                <span className="font-semibold text-inabie-navy">
                  {selectedIds.size} seleccionado
                  {selectedIds.size !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          )}
        </section>
      )}

      <Button
        onClick={handlePreviewImg}
        className="bg-inabie-navy hover:bg-inabie-navy-deep text-white gap-1.5 h-8"
      >
        Descargar subsanables.
      </Button>

{showPreview && (
  <Dialog open={showPreview} onOpenChange={setShowPreview}>
    <DialogContent className="max-w-7xl w-full h-[95vh] p-2 flex items-center justify-center">
      <img
        src={previewImg}
        alt="Vista previa"
        className="w-auto h-full object-contain rounded-md"
      />
    </DialogContent>
  </Dialog>
)}

      {/* Email preview dialog */}
      <Dialog
        open={!!emailPreviews}
        onOpenChange={(open) => !open && setEmailPreviews(null)}
      >
        <DialogContent className="max-w-2xl flex flex-col max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>
              {emailPreviews?.length === 1
                ? "Vista previa del correo"
                : `Vista previa — ${emailPreviews?.length} correos`}
            </DialogTitle>
            <DialogDescription>
              Simulación de envío. En producción se entregarán por servicio de
              correo.
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 space-y-3 pr-1 py-1">
            {emailPreviews?.map((entry, i) => (
              <EmailCard
                key={i}
                entry={entry}
                index={i}
                total={emailPreviews.length}
              />
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailPreviews(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Email card ───────────────────────────────────────────────────────────────

function EmailCard({
  entry,
  index,
  total,
}: {
  entry: EmailEntry;
  index: number;
  total: number;
}) {
  return (
    <div className="rounded-lg border bg-white overflow-hidden">
      {total > 1 && (
        <div className="px-3 py-1.5 bg-muted/40 border-b text-xs text-muted-foreground font-medium">
          Correo {index + 1} de {total} · {entry.oferenteNombre}
        </div>
      )}
      <div className="p-4 space-y-3 text-sm">
        <div className="rounded-md bg-muted/50 p-3 space-y-1">
          <p>
            <span className="text-muted-foreground">Para:</span> {entry.correo}
          </p>
          <p>
            <span className="text-muted-foreground">Asunto:</span> Carga de
            documentación requerida — {entry.proceso.codigo}
          </p>
        </div>
        <div className="rounded-md border p-4 bg-white">
          <p>
            Estimado <strong>{entry.oferenteNombre}</strong>,
          </p>
          <p className="mt-2 text-muted-foreground">
            Se le notifica que debe acceder al siguiente enlace para completar
            la carga de documentación requerida para el proceso{" "}
            <strong>{entry.proceso.codigo}</strong>.
          </p>
          <a
            href={entry.url}
            target="_blank"
            rel="noreferrer"
            className="inline-block mt-3 px-4 py-2 rounded-md bg-inabie-navy text-white text-xs font-medium"
          >
            Acceder al portal
          </a>
        </div>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={entry.url}
            className="flex-1 text-xs px-2 py-1.5 border rounded-md font-mono bg-muted/30"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(entry.url);
              toast.success("Enlace copiado");
            }}
          >
            <Copy className="h-3.5 w-3.5" /> Copiar
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileText;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
        <Icon className="h-4 w-4 text-inabie-navy" />
      </div>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
