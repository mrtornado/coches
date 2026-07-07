export const webSiteConfig = {
  name: 'Luxoria Drive',
  url: 'https://luxoriadrive.com',
  phone: '+34 692 17 20 15',
  phoneHref: 'tel:+34692172015',
  company: {
    name: 'Luxoria Drive',
    address: {
      street: 'Avenida del Mediterráneo, 15',
      city: 'Benidorm',
      province: 'Alicante',
      postalCode: '03503',
      country: 'España',
    },
    fullAddress: 'Avenida del Mediterráneo, 15, 03503 Benidorm, Alicante, España',
  },
} as const;

export type WebSiteConfig = typeof webSiteConfig;
