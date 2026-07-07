export const languages = { es: 'ES', en: 'EN' } as const;
export type Lang = keyof typeof languages;
export const defaultLang: Lang = 'es';

export const ui = {
  es: {
    'nav.location': 'Benidorm · Costa Blanca',

    'home.eyebrow': 'Alquiler premium',
    'home.title1': 'Conduce el',
    'home.titleAccent': 'Mediterráneo',
    'home.lead1':
      'Una flota selecta para tus días en la Costa Blanca. Reserva directa con nosotros —',
    'home.leadAccent': 'sin pagos online, sin comisiones.',
    'home.viewFleet': 'Ver la flota',
    'home.bookByPhone': 'Reservar por teléfono',
    'home.featured': 'Destacado',
    'home.perDay': 'por día',

    'fleet.label': 'La flota',
    'fleet.title': 'Elige tu coche',
    'fleet.modelOne': 'modelo disponible',
    'fleet.modelMany': 'modelos disponibles',
    'fleet.emptyTitle': 'Flota en preparación',
    'fleet.emptySub': 'Muy pronto, coches de lujo listos para la carretera.',
    'fleet.call': 'Llámanos',
    'card.reserve': 'Reservar',

    'spec.seats': 'plazas',
    'spec.seatsLabel': 'Plazas',
    'spec.transmission': 'Cambio',
    'spec.fuel': 'Combustible',
    'km.unlimitedShort': 'Km ilimitados',
    'km.perDayShort': 'km/día',
    'km.unlimitedLong': 'Kilómetros ilimitados',
    'km.perDayLong': 'km / día',

    'usp1.title': 'Reserva directa',
    'usp1.desc': 'Sin pagos online ni comisiones. Confirmamos tu coche contigo, de tú a tú.',
    'usp2.title': 'Entrega en Benidorm',
    'usp2.tail': 'En pleno corazón de la Costa Blanca.',
    'usp3.title': 'Atención personal',
    'usp3.desc': 'Una llamada y listo. Siempre al otro lado.',

    'footer.eyebrow': '¿Nos vamos?',
    'footer.title1': 'Tu próxima ruta empieza con una',
    'footer.titleAccent': 'llamada',
    'footer.admin': 'Admin',

    'car.back': 'Volver a la flota',
    'car.perDay': '/ día',
    'book.title': 'Reserva este coche',
    'book.sub': 'Sin pagos online. Contacto directo — te confirmamos la disponibilidad.',
    'book.or': 'o déjanos tus datos',
    'book.name': 'Nombre',
    'book.phone': 'Teléfono',
    'book.email': 'Email',
    'book.message': 'Mensaje',
    'book.send': 'Enviar solicitud',
    'book.sentTitle': '¡Solicitud enviada!',
    'book.sentSub': 'Te contactamos muy pronto para confirmar. Si tienes prisa, llámanos:',
    'book.pickupAt': 'Recogida en',

    'dates.pickup': 'Recogida',
    'dates.return': 'Devolución',
    'dates.choose': 'Elegir fecha',
    'dates.clear': 'Limpiar',
    'dates.done': 'Listo',
  },
  en: {
    'nav.location': 'Benidorm · Costa Blanca',

    'home.eyebrow': 'Premium car rental',
    'home.title1': 'Drive the',
    'home.titleAccent': 'Mediterranean',
    'home.lead1':
      'A select fleet for your days on the Costa Blanca. Book directly with us —',
    'home.leadAccent': 'no online payments, no fees.',
    'home.viewFleet': 'View the fleet',
    'home.bookByPhone': 'Book by phone',
    'home.featured': 'Featured',
    'home.perDay': 'per day',

    'fleet.label': 'The fleet',
    'fleet.title': 'Choose your car',
    'fleet.modelOne': 'car available',
    'fleet.modelMany': 'cars available',
    'fleet.emptyTitle': 'Fleet coming soon',
    'fleet.emptySub': 'Luxury cars ready for the road, coming very soon.',
    'fleet.call': 'Call us',
    'card.reserve': 'Book now',

    'spec.seats': 'seats',
    'spec.seatsLabel': 'Seats',
    'spec.transmission': 'Transmission',
    'spec.fuel': 'Fuel',
    'km.unlimitedShort': 'Unlimited km',
    'km.perDayShort': 'km/day',
    'km.unlimitedLong': 'Unlimited kilometres',
    'km.perDayLong': 'km / day',

    'usp1.title': 'Direct booking',
    'usp1.desc': 'No online payments or fees. We confirm your car with you, one to one.',
    'usp2.title': 'Delivery in Benidorm',
    'usp2.tail': 'Right in the heart of the Costa Blanca.',
    'usp3.title': 'Personal service',
    'usp3.desc': 'One call and you are done. Always on the other end.',

    'footer.eyebrow': 'Shall we go?',
    'footer.title1': 'Your next trip starts with a',
    'footer.titleAccent': 'call',
    'footer.admin': 'Admin',

    'car.back': 'Back to the fleet',
    'car.perDay': '/ day',
    'book.title': 'Book this car',
    'book.sub': 'No online payments. Direct contact — we confirm availability.',
    'book.or': 'or leave your details',
    'book.name': 'Name',
    'book.phone': 'Phone',
    'book.email': 'Email',
    'book.message': 'Message',
    'book.send': 'Send request',
    'book.sentTitle': 'Request sent!',
    'book.sentSub': 'We will contact you very soon to confirm. In a hurry? Call us:',
    'book.pickupAt': 'Pick-up at',

    'dates.pickup': 'Pick-up',
    'dates.return': 'Return',
    'dates.choose': 'Choose date',
    'dates.clear': 'Clear',
    'dates.done': 'Done',
  },
} satisfies Record<Lang, Record<string, string>>;

export type UiKey = keyof (typeof ui)['es'];

export function useTranslations(lang: Lang) {
  return function t(key: UiKey): string {
    return ui[lang][key] ?? ui[defaultLang][key];
  };
}

/** Locale currency/number formatter for prices (EUR, no decimals). */
export function priceFormatter(lang: Lang) {
  return new Intl.NumberFormat(lang === 'en' ? 'en-GB' : 'es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  });
}

/** Transmission is an enum; translate the known values, pass others through. */
export function translateTransmission(value: string | null | undefined, lang: Lang): string | null {
  if (!value) return null;
  if (lang === 'en' && value === 'Automático') return 'Automatic';
  return value;
}

/** Build the alternate-language URL for a locale-neutral path (e.g. "/car/3"). */
export function localizedPath(lang: Lang, neutralPath: string): string {
  const clean = neutralPath === '/' ? '' : neutralPath;
  return lang === 'en' ? `/en${clean}` : clean || '/';
}
