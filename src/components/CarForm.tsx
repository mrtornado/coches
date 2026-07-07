import { useState } from 'react';

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
  description?: string | null;
  imageUrl?: string | null;
}

interface CarFormProps {
  action: string;
  submitLabel?: string;
  car?: CarFormValues;
}

export default function CarForm({ action, submitLabel = 'Añadir coche', car }: CarFormProps) {
  const editing = car?.id != null;
  const [preview, setPreview] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);

  function onImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setPreview(file ? URL.createObjectURL(file) : null);
    if (file) setRemovePhoto(false);
  }

  const currentImage = !removePhoto && !preview ? car?.imageUrl ?? null : null;
  const shownImage = preview ?? currentImage;

  return (
    <form method="post" action={action} encType="multipart/form-data" className="space-y-4">
      {editing && <input type="hidden" name="id" value={car!.id} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">Título *</span>
          <input
            name="title"
            required
            defaultValue={car?.title ?? ''}
            placeholder="Ej: Volkswagen Golf 1.6 TDI"
            className={inputClass}
          />
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
          <input
            name="seats"
            type="number"
            min="1"
            max="99"
            defaultValue={car?.seats ?? ''}
            placeholder="5"
            className={inputClass}
          />
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
          <input
            name="fuel"
            defaultValue={car?.fuel ?? ''}
            placeholder="Diésel / Gasolina / Eléctrico"
            className={inputClass}
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">Descripción</span>
          <textarea name="description" rows={3} defaultValue={car?.description ?? ''} className={inputClass} />
        </label>

        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">
            {editing ? 'Cambiar foto' : 'Foto'}
          </span>
          <input
            name="image"
            type="file"
            accept="image/*"
            onChange={onImageChange}
            className="mt-1 block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
          />
        </label>
      </div>

      {shownImage && (
        <div>
          <img src={shownImage} alt="Foto del coche" className="h-40 w-full rounded-lg object-cover sm:w-80" />
          {preview && <p className="mt-1 text-xs text-slate-400">Nueva foto seleccionada</p>}
        </div>
      )}

      {editing && car?.imageUrl && (
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            name="removePhoto"
            value="1"
            checked={removePhoto}
            onChange={(e) => setRemovePhoto(e.target.checked)}
          />
          Eliminar la foto actual
        </label>
      )}

      <button
        type="submit"
        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
      >
        {submitLabel}
      </button>
    </form>
  );
}
