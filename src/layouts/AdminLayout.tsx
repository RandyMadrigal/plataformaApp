import { Link, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, ClipboardCheck, ArrowLeft } from "lucide-react";

const NAV = [
  { to: "/admin", label: "Procesos", icon: LayoutDashboard, exact: true },
  { to: "/admin/verificaciones", label: "Verificaciones", icon: ClipboardCheck, exact: false },
] as const;

export function AdminLayout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-60 flex-col bg-inabie-navy text-white">
        <div className="px-5 py-5 border-b border-white/10">
          <h1 className="text-lg font-semibold leading-tight">INABIE Admin</h1>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={[
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  active ? "bg-white/15 text-white" : "text-white/75 hover:bg-white/10",
                ].join(" ")}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-white/10">
          <Link
            to="/"
            className="flex items-center gap-2 text-xs text-white/70 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Volver al portal
          </Link>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden bg-inabie-navy text-white px-4 py-3 flex items-center justify-between">
          <span className="font-semibold">Admin</span>
          <nav className="flex gap-3 text-sm">
            {NAV.map((i) => (
              <Link key={i.to} to={i.to} className="text-white/80">
                {i.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
