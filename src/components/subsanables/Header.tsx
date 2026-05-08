import logo from "@/assets/inabie-logo.jpg";

export function Header() {
  return (
    <header className="w-full border-b border-inabie-gray-soft bg-white">
      <div className="h-2 w-full bg-inabie-navy-deep" />
      <div className="px-6 py-4">
        <img src={logo} alt="INABIE - Gobierno de la República Dominicana" className="h-16 w-auto" />
      </div>
    </header>
  );
}