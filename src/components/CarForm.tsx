import { useRef, useState } from 'react';

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none';

export interface CarFormValues {
  id?: number;
  title?: string | null;
  brand?: string | null;
  pricePerDay?: string | number | null;
  seats?: number | null;
  transmission?: string | null;
  fuel?: string | null;
  kmUnlimited?: boolean | null;
  kmPerDay?: number | null;
  description?: string | null;
  descriptionEn?: string | null;
}

export interface ExistingImage {
  id: number;
  url: string;
}

interface CarFormProps {
  action: string;
  submitLabel?: string;
  car?: CarFormValues;
  images?: ExistingImage[];
  onCancel?: () => void;
}

interface NewFile {
  uid: number;
  file: File;
  url: string;
}

type Cover = { kind: 'existing'; id: number } | { kind: 'new'; uid: number } | null;

export default function CarForm({
  action,
  submitLabel = 'Añadir coche',
  car,
  images = [],
  onCancel,
}: CarFormProps) {
  const editing = car?.id != null;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uidRef = useRef(0);

  const [newFiles, setNewFiles] = useState<NewFile[]>([]);
  const [deletedIds, setDeletedIds] = useState<Set<number>>(new Set());
  const [cover, setCover] = useState<Cover>(null);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [kmUnlimited, setKmUnlimited] = useState<boolean>(car?.kmUnlimited ?? true);
  const [kmPerDay, setKmPerDay] = useState<string>(car?.kmPerDay != null ? String(car.kmPerDay) : '');

  const existingVisible = images.filter((img) => !deletedIds.has(img.id));

  type DisplayItem =
    | { kind: 'existing'; id: number; url: string }
    | { kind: 'new'; uid: number; url: string };
  const displayItems: DisplayItem[] = [
    ...existingVisible.map((e) => ({ kind: 'existing' as const, id: e.id, url: e.url })),
    ...newFiles.map((n) => ({ kind: 'new' as const, uid: n.uid, url: n.url })),
  ];
  const keyOf = (it: DisplayItem) => (it.kind === 'existing' ? `e${it.id}` : `n${it.uid}`);

  // Which photo is the cover? Explicit choice if still present, otherwise the first one.
  let effectiveKey: string | null = null;
  if (cover) {
    const ck = cover.kind === 'existing' ? `e${cover.id}` : `n${cover.uid}`;
    if (displayItems.some((it) => keyOf(it) === ck)) effectiveKey = ck;
  }
  if (!effectiveKey && displayItems[0]) effectiveKey = keyOf(displayItems[0]);

  const totalPhotos = displayItems.length;

  function addFiles(list: FileList | null) {
    if (!list) return;
    const picked = Array.from(list)
      .filter((f) => f.type.startsWith('image/'))
      .map((file) => ({ uid: uidRef.current++, file, url: URL.createObjectURL(file) }));
    if (picked.length) setNewFiles((prev) => [...prev, ...picked]);
  }

  function removeNew(uid: number) {
    setNewFiles((prev) => {
      const removed = prev.find((n) => n.uid === uid);
      if (removed) URL.revokeObjectURL(removed.url);
      return prev.filter((n) => n.uid !== uid);
    });
  }

  function deleteExisting(id: number) {
    setDeletedIds((prev) => new Set(prev).add(id));
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    setError(null);
    setSubmitting(true);

    const fd = new FormData(form);
    fd.set('kmUnlimited', kmUnlimited ? 'true' : 'false');
    fd.set('kmPerDay', kmUnlimited ? '' : kmPerDay);
    for (const nf of newFiles) fd.append('image', nf.file);
    for (const id of deletedIds) fd.append('deleteImageIds', String(id));

    // Which photo should be the cover?
    if (effectiveKey) {
      const chosen = displayItems.find((it) => keyOf(it) === effectiveKey)!;
      if (chosen.kind === 'existing') {
        fd.set('coverImageId', String(chosen.id));
      } else {
        fd.set('coverNewIndex', String(newFiles.findIndex((n) => n.uid === chosen.uid)));
      }
    }

    try {
      const res = await fetch(action, { method: 'POST', body: fd });
      if (res.ok || res.redirected) {
        window.location.href = res.url || '/admin';
        return;
      }
      setError('Ha ocurrido un error al guardar. Inténtalo de nuevo.');
    } catch {
      setError('Fallo de conexión. Revisa la red e inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {editing && <input type="hidden" name="id" value={car!.id} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">Título *</span>
          <input name="title" required defaultValue={car?.title ?? ''} placeholder="Ej: Volkswagen Golf 1.6 TDI" className={inputClass} />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Marca</span>
          <input name="brand" defaultValue={car?.brand ?? ''} placeholder="Volkswagen" className={inputClass} />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Precio por día (€) *</span>
          <input
            name="pricePerDay"
            type="number"
            min="0"
            step="1"
            required
            defaultValue={car?.pricePerDay != null ? Number(car.pricePerDay) : ''}
            placeholder="35"
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Plazas</span>
          <input name="seats" type="number" min="1" max="99" defaultValue={car?.seats ?? ''} placeholder="5" className={inputClass} />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Transmisión</span>
          <select name="transmission" className={inputClass} defaultValue={car?.transmission ?? 'Manual'}>
            <option value="Manual">Manual</option>
            <option value="Automático">Automático</option>
          </select>
        </label>

        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">Combustible</span>
          <input name="fuel" defaultValue={car?.fuel ?? ''} placeholder="Diésel / Gasolina / Eléctrico" className={inputClass} />
        </label>
      </div>

      {/* ---- Kilometraje ---- */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <span className="text-sm font-medium text-slate-700">Kilometraje</span>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => setKmUnlimited(true)}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
              kmUnlimited ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
            }`}
          >
            Ilimitado
          </button>
          <button
            type="button"
            onClick={() => setKmUnlimited(false)}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
              !kmUnlimited ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
            }`}
          >
            Limitado
          </button>
        </div>
        {!kmUnlimited && (
          <label className="mt-3 block">
            <span className="text-sm text-slate-600">Límite de km por día *</span>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="100000"
                required={!kmUnlimited}
                value={kmPerDay}
                onChange={(e) => setKmPerDay(e.target.value)}
                placeholder="200"
                className="w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
              <span className="text-sm text-slate-500">km / día</span>
            </div>
          </label>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Descripción <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">ES</span>
          </span>
          <textarea name="description" rows={4} defaultValue={car?.description ?? ''} placeholder="Descripción en español…" className={inputClass} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Descripción <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">EN</span>
          </span>
          <textarea name="descriptionEn" rows={4} defaultValue={car?.descriptionEn ?? ''} placeholder="Description in English…" className={inputClass} />
        </label>
      </div>

      {/* ---- Photos: drag & drop + cover selection ---- */}
      <div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">
            Fotos {totalPhotos > 0 && <span className="text-slate-400">({totalPhotos})</span>}
          </span>
          {totalPhotos > 1 && (
            <span className="text-xs text-slate-400">Pasa el ratón y elige la portada</span>
          )}
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`mt-1 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 text-center transition ${
            dragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
          }`}
        >
          <div className="text-2xl">🖼️</div>
          <p className="mt-1 text-sm text-slate-600">
            Arrastra las fotos aquí o <span className="font-medium text-blue-600">haz clic para elegir</span>
          </p>
          <p className="text-xs text-slate-400">Puedes añadir varias a la vez</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>

        {displayItems.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {displayItems.map((it) => {
              const isCover = keyOf(it) === effectiveKey;
              const isNew = it.kind === 'new';
              return (
                <div
                  key={keyOf(it)}
                  className={`group relative aspect-square overflow-hidden rounded-lg border-2 transition ${
                    isCover ? 'border-blue-600 ring-2 ring-blue-200' : 'border-slate-200'
                  }`}
                >
                  <img src={it.url} alt="" className="h-full w-full object-cover" />

                  {isCover ? (
                    <span className="absolute left-1 top-1 z-10 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
                      ★ Portada
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setCover(it.kind === 'existing' ? { kind: 'existing', id: it.id } : { kind: 'new', uid: it.uid })
                      }
                      className="absolute inset-x-1 bottom-1 z-10 rounded bg-black/60 px-1.5 py-1 text-[10px] font-medium text-white opacity-0 transition hover:bg-black/80 group-hover:opacity-100"
                    >
                      Hacer portada
                    </button>
                  )}

                  {isNew && (
                    <span className="absolute bottom-1 right-1 rounded bg-green-600 px-1.5 py-0.5 text-[10px] text-white group-hover:opacity-0">
                      Nueva
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => (it.kind === 'existing' ? deleteExisting(it.id) : removeNew(it.uid))}
                    className="absolute right-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-0 transition group-hover:opacity-100"
                    aria-label="Quitar foto"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-500 transition hover:text-slate-800"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {submitting ? 'Guardando…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
