import { useEffect, useRef, useState } from 'react';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function iso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayMidnight(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function pretty(isoStr: string): string {
  const [y, m, d] = isoStr.split('-').map(Number);
  return `${String(d).padStart(2, '0')} ${MONTHS[m - 1].slice(0, 3).toLowerCase()} ${y}`;
}

const triggerClass =
  'mt-1 w-full rounded-sm border px-3 py-2.5 text-left text-sm transition focus:outline-none';

export default function BookingDates() {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState<string | null>(null);
  const [end, setEnd] = useState<string | null>(null);
  const today = todayMidnight();
  const [view, setView] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function pickDay(dayIso: string) {
    if (!start || (start && end)) {
      setStart(dayIso);
      setEnd(null);
    } else if (dayIso < start) {
      setStart(dayIso);
    } else if (dayIso === start) {
      // ignore
    } else {
      setEnd(dayIso);
      setOpen(false);
    }
  }

  // Build the month grid
  const y = view.getFullYear();
  const m = view.getMonth();
  const firstWeekday = (new Date(y, m, 1).getDay() + 6) % 7; // Mon = 0
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(iso(new Date(y, m, d)));

  const canGoPrev = new Date(y, m, 1) > new Date(today.getFullYear(), today.getMonth(), 1);

  return (
    <div className="relative" ref={ref}>
      <input type="hidden" name="startDate" value={start ?? ''} />
      <input type="hidden" name="endDate" value={end ?? ''} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <span className="text-xs uppercase tracking-widest text-taupe">Recogida</span>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={`${triggerClass} ${
              open && !start ? 'border-gold/60' : 'border-cream/15'
            } bg-ink ${start ? 'text-cream' : 'text-taupe/60'}`}
          >
            {start ? pretty(start) : 'Elegir fecha'}
          </button>
        </div>
        <div>
          <span className="text-xs uppercase tracking-widest text-taupe">Devolución</span>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={`${triggerClass} border-cream/15 bg-ink ${end ? 'text-cream' : 'text-taupe/60'}`}
          >
            {end ? pretty(end) : 'Elegir fecha'}
          </button>
        </div>
      </div>

      {open && (
        <div className="absolute left-0 right-0 z-30 mt-2 rounded-sm border border-cream/15 bg-ink-raise p-4 shadow-2xl shadow-black/50">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              disabled={!canGoPrev}
              onClick={() => setView(new Date(y, m - 1, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full text-cream transition hover:bg-cream/10 disabled:opacity-25"
              aria-label="Mes anterior"
            >
              ‹
            </button>
            <span className="font-display text-lg">
              {MONTHS[m]} {y}
            </span>
            <button
              type="button"
              onClick={() => setView(new Date(y, m + 1, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full text-cream transition hover:bg-cream/10"
              aria-label="Mes siguiente"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((w) => (
              <span key={w} className="py-1 text-[10px] uppercase tracking-widest text-taupe/60">
                {w}
              </span>
            ))}
            {cells.map((cell, i) => {
              if (!cell) return <span key={`e-${i}`} />;
              const dayDate = new Date(cell + 'T00:00:00');
              const disabled = dayDate < today;
              const isStart = cell === start;
              const isEnd = cell === end;
              const inRange = !!start && !!end && cell > start && cell < end;
              const selected = isStart || isEnd;
              const dayNum = Number(cell.split('-')[2]);
              return (
                <button
                  key={cell}
                  type="button"
                  disabled={disabled}
                  onClick={() => pickDay(cell)}
                  className={`h-9 rounded-sm text-sm transition ${
                    disabled ? 'cursor-not-allowed text-cream/15' : 'text-cream hover:bg-gold/20'
                  } ${selected ? 'bg-gold font-semibold text-ink hover:bg-gold' : ''} ${
                    inRange ? 'bg-gold/15' : ''
                  }`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-cream/10 pt-3">
            <button
              type="button"
              onClick={() => {
                setStart(null);
                setEnd(null);
              }}
              className="text-xs uppercase tracking-widest text-taupe transition hover:text-cream"
            >
              Limpiar
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-sm bg-gold px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-ink transition hover:bg-gold-light"
            >
              Listo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
