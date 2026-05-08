interface ProcessBannerProps {
  description: string;
  code: string;
  /** Total remaining seconds (controlled by parent). Omit to hide the timer. */
  remainingSeconds?: number;
}

function getTimeParts(totalSeconds: number) {
  const s = Math.max(totalSeconds, 0);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

export function ProcessBanner({ description, code, remainingSeconds }: ProcessBannerProps) {
  const showTimer = remainingSeconds !== undefined;
  const expired = showTimer && remainingSeconds <= 0;
  const { days, hours, minutes, seconds } = getTimeParts(remainingSeconds ?? 0);

  return (
    <section className="bg-inabie-navy text-white">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 px-6 py-5">
        {/* INFO */}
        <div className="space-y-2">
          <p className="text-xs md:text-sm font-medium tracking-wide uppercase leading-snug max-w-3xl">
            {description}
          </p>
          <h1 className="text-lg md:text-xl font-bold tracking-wider">
            {code}
          </h1>
        </div>

        {/* CONTADOR */}
        {showTimer && (
          <div className="flex flex-col items-start md:items-end justify-center gap-2">
            <span className="text-xs md:text-sm font-medium opacity-90">
              Tiempo restante:
            </span>

            {expired ? (
              <span className="text-status-error font-medium">
                Expirado
              </span>
            ) : (
              <div
                className="grid grid-cols-4 gap-4 text-center font-mono tabular-nums"
                aria-live="polite"
              >
                {/* NÚMEROS */}
                <span className="text-3xl md:text-4xl font-light">{days}</span>
                <span className="text-3xl md:text-4xl font-light">{hours}</span>
                <span className="text-3xl md:text-4xl font-light">{minutes}</span>
                <span className="text-3xl md:text-4xl font-light">{seconds}</span>

                {/* ETIQUETAS */}
                <span className="text-xs uppercase tracking-wide opacity-80">
                  días
                </span>
                <span className="text-xs uppercase tracking-wide opacity-80">
                  horas
                </span>
                <span className="text-xs uppercase tracking-wide opacity-80">
                  minutos
                </span>
                <span className="text-xs uppercase tracking-wide opacity-80">
                  segundos
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
