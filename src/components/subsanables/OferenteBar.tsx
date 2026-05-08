interface OferenteBarProps {
  nombre: string;
  rnc: string;
}

export function OferenteBar({ nombre, rnc }: OferenteBarProps) {
  return (
    <div className="bg-inabie-gray text-white px-6 py-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-8">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="font-bold text-sm md:text-base text-black">Nombre del oferente:</span>
          <span className="text-sm md:text-base text-black">{nombre}</span>
        </div>
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="font-bold text-sm md:text-base text-black">RNC:</span>
          <span className="text-sm md:text-base text-black">{rnc}</span>
        </div>
      </div>
    </div>
  );
}