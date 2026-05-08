import { useMemo, useState } from "react";
import { CheckCircle2, Clock, XCircle, ChevronDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ESTADO_LABEL, useDb } from "@/lib/rpm-store";

function fmt(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleString("es-DO", { dateStyle: "short", timeStyle: "short" });
}

const ALL = "__all__";

export function VerificacionesPage() {
  const db = useDb();
  const [procesoFiltro, setProcesoFiltro] = useState<string>(ALL);

  const procesoActivo = useMemo(
    () => db.procesos.find((p) => p.id === procesoFiltro) ?? null,
    [db.procesos, procesoFiltro],
  );

  const notificacionesFiltradas = useMemo(() => {
    if (procesoFiltro === ALL) return db.notificaciones;
    return db.notificaciones.filter((n) => n.proceso_id === procesoFiltro);
  }, [db.notificaciones, procesoFiltro]);

  return (
    <div className="space-y-6 max-w-6xl">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Verificaciones</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Estado de acceso y carga de documentación por oferente.
        </p>
      </header>

      <div className="bg-white border rounded-lg overflow-hidden">
        {/* Toolbar */}
        <div className="px-4 py-3 border-b flex items-center justify-between gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 h-8 text-sm max-w-xs">
                <span className="truncate">
                  {procesoActivo ? procesoActivo.codigo : "Todos los procesos"}
                </span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-w-sm">
              <DropdownMenuItem
                onSelect={() => setProcesoFiltro(ALL)}
                className={procesoFiltro === ALL ? "font-medium" : ""}
              >
                Todos los procesos
              </DropdownMenuItem>
              {db.procesos.map((p) => (
                <DropdownMenuItem
                  key={p.id}
                  onSelect={() => setProcesoFiltro(p.id)}
                  className={procesoFiltro === p.id ? "font-medium" : ""}
                >
                  <span className="font-mono text-xs text-inabie-navy mr-2">{p.codigo}</span>
                  <span className="truncate text-muted-foreground">{p.nombre}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <span className="text-xs text-muted-foreground">
            {notificacionesFiltradas.length}{" "}
            {notificacionesFiltradas.length === 1 ? "Oferente" : "Oferentes"}
          </span>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Proceso</TableHead>
              <TableHead>Oferente</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Accedió</TableHead>
              <TableHead>Documentos</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Última fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {notificacionesFiltradas.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                  {procesoFiltro === ALL
                    ? "Aún no hay notificaciones enviadas."
                    : `No hay notificaciones para ${procesoActivo?.codigo ?? "este proceso"}.`}
                </TableCell>
              </TableRow>
            )}
            {notificacionesFiltradas.map((n) => {
              const proceso = db.procesos.find((p) => p.id === n.proceso_id);
              const oferente = db.oferentes.find((o) => o.id === n.oferente_id);
              return (
                <TableRow key={n.id}>
                  <TableCell className="font-mono text-xs">{proceso?.codigo}</TableCell>
                  <TableCell className="font-medium">{oferente?.nombre}</TableCell>
                  <TableCell>{oferente?.correo}</TableCell>
                  <TableCell>
                    {n.fecha_acceso ? (
                      <span className="inline-flex items-center gap-1 text-status-success text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5" /> {fmt(n.fecha_acceso)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-muted-foreground text-xs">
                        <XCircle className="h-3.5 w-3.5" /> No
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {n.documentos.length > 0 ? `${n.documentos.length} archivo(s)` : "—"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={[
                        "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full",
                        n.estado === "completada"
                          ? "bg-status-success/15 text-status-success"
                          : n.estado === "accedio"
                            ? "bg-inabie-navy/10 text-inabie-navy"
                            : n.estado === "enviada"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-muted text-muted-foreground",
                      ].join(" ")}
                    >
                      {n.estado === "completada" ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                      {ESTADO_LABEL[n.estado]}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {fmt(n.fecha_carga ?? n.fecha_acceso ?? n.fecha_envio)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}