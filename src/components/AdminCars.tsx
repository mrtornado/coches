import { useEffect, useState } from 'react';
import CarForm, { type CarFormValues, type ExistingImage } from './CarForm';

export interface AdminCar extends CarFormValues {
  id: number;
  title: string;
  pricePerDay: string;
  available: boolean;
  imageUrl: string | null;
  images: ExistingImage[];
}

interface Props {
  cars: AdminCar[];
}

const priceFmt = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

function kmLabel(car: AdminCar): string {
  if (car.kmUnlimited ?? true) return 'Ilimitado';
  return car.kmPerDay ? `${car.kmPerDay} km/día` : 'Limitado';
}

export default function AdminCars({ cars }: Props) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCar | null>(null);

  function openAdd() {
    setEditing(null);
    setOpen(true);
  }
  function openEdit(car: AdminCar) {
    setEditing(car);
    setOpen(true);
  }
  function close() {
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Coches ({cars.length})</h2>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          <span className="text-base leading-none">+</span> Añadir coche
        </button>
      </div>

      {cars.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          Todavía no hay coches. Pulsa <span className="font-medium">“Añadir coche”</span> para empezar.
        </p>
      ) : (
        <div className="space-y-3">
          {cars.map((car) => (
            <div
              key={car.id}
              className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:p-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  {car.imageUrl ? (
                    <img src={car.imageUrl} alt={car.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-300">🚗</div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">{car.title}</p>
                  {car.brand && <p className="text-xs text-slate-400">{car.brand}</p>}
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span className="font-semibold text-slate-700">{priceFmt.format(Number(car.pricePerDay))}/día</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] ${
                        car.kmUnlimited ?? true ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {kmLabel(car)}
                    </span>
                    {car.available ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] text-green-700">Disponible</span>
                    ) : (
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] text-slate-600">Oculto</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 sm:ml-auto sm:shrink-0">
                <button
                  type="button"
                  onClick={() => openEdit(car)}
                  className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700 sm:flex-none"
                >
                  Editar
                </button>
                <form method="post" action="/api/cars/toggle" className="flex-1 sm:flex-none">
                  <input type="hidden" name="id" value={car.id} />
                  <button className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">
                    {car.available ? 'Ocultar' : 'Mostrar'}
                  </button>
                </form>
                <form
                  method="post"
                  action="/api/cars/delete"
                  className="flex-1 sm:flex-none"
                  onSubmit={(e) => {
                    if (!confirm('¿Eliminar este coche?')) e.preventDefault();
                  }}
                >
                  <input type="hidden" name="id" value={car.id} />
                  <button className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                    Eliminar
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ---- Modal ---- */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm sm:p-8"
          onClick={close}
        >
          <div
            className="my-auto w-full max-w-2xl rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-lg font-semibold">{editing ? 'Editar coche' : 'Añadir coche'}</h3>
              <button
                type="button"
                onClick={close}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            <div className="px-6 py-6">
              <CarForm
                key={editing ? `edit-${editing.id}` : 'add'}
                action={editing ? '/api/cars/update' : '/api/cars/create'}
                submitLabel={editing ? 'Guardar cambios' : 'Añadir coche'}
                car={editing ?? undefined}
                images={editing?.images ?? []}
                onCancel={close}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
