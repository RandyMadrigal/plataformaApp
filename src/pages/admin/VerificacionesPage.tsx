import { CheckCircle2, Clock, XCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ESTADO_LABEL, useDb } from "@/lib/rpm-store";

function fmt(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleString("es-DO", { dateStyle: "short", timeStyle: "short" });
}

export function VerificacionesPage() {
  const db = useDb();

  return (
    <div className="space-y-6 max-w-6xl">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Verificaciones</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Estado de acceso y carga de documentación por oferente.
        </p>
      </header>

      <div className="bg-white border rounded-lg overflow-hidden">
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
            {db.notificaciones.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Aún no hay notificaciones enviadas.
                </TableCell>
              </TableRow>
            )}
            {db.notificaciones.map((n) => {
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
