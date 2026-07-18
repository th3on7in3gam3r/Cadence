/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Landing page social proof — edit quotes and names here without touching layout.
 * Testimonials are empty until real verified quotes are added.
 */

export interface TrustedBrand {
  name: string;
  logoSrc: string;
  logoAlt: string;
  href?: string;
}

export interface LandingTestimonial {
  quote: string;
  pullQuote?: string;
  name: string;
  role: string;
  company: string;
  rating: number;
  featured?: boolean;
}

export const TRUSTED_BY: TrustedBrand[] = [
  {
    name: 'BibleFunLand Studios',
    logoSrc: '/landing/logos/biblefunland.svg',
    logoAlt: 'BibleFunLand Studios',
    href: 'https://www.biblefunlandstudios.com/',
  },
  {
    name: 'Kerygma Social',
    logoSrc: '/landing/logos/kerygma.svg',
    logoAlt: 'Kerygma Social',
    href: 'https://kerygmasocial.com',
  },
  {
    name: 'Postwick',
    logoSrc: '/landing/logos/postwick.svg',
    logoAlt: 'Postwick',
    href: 'https://postwick.vercel.app',
  },
  {
    name: 'CitePilot',
    logoSrc: '/landing/logos/citepilot.svg',
    logoAlt: 'CitePilot',
    href: 'https://getcitepilot.com',
  },
  {
    name: 'Aegis Loop',
    logoSrc: '/landing/logos/aegis-loop.svg',
    logoAlt: 'Aegis Loop',
    href: 'https://aegis-loop.com',
  },
];

/** Add verified customer quotes here — section hidden when empty. */
export const TESTIMONIALS: LandingTestimonial[] = [];

export const FEATURED_TESTIMONIALS = TESTIMONIALS.filter((t) => t.featured);
