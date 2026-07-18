/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Landing page social proof — edit quotes and names here without touching layout.
 */

export interface TrustedBrand {
  name: string;
  href?: string;
}

export interface LandingTestimonial {
  quote: string;
  name: string;
  role: string;
  company: string;
}

export const TRUSTED_BY: TrustedBrand[] = [
  { name: 'BibleFunLand Studios', href: 'https://www.biblefunlandstudios.com/' },
  { name: 'Kerygma Social', href: 'https://kerygmasocial.com' },
  { name: 'Postwick', href: 'https://postwick.vercel.app' },
  { name: 'CitePilot', href: 'https://getcitepilot.com' },
  { name: 'Aegis Loop', href: 'https://aegis-loop.com' },
];

export const TESTIMONIALS: LandingTestimonial[] = [
  {
    quote:
      'We run several studio brands from one Cadence workspace. Paste a URL, get a strategy brief, and ship campaigns without bouncing between five tabs.',
    name: 'Jerless M.',
    role: 'Founder',
    company: 'BibleFunLand Studios',
  },
  {
    quote:
      'Kerygma handles publishing — Cadence handles the strategy and copy underneath. Our team went from blank page to a full content plan in under ten minutes.',
    name: 'Studio team',
    role: 'Marketing',
    company: 'Kerygma Social',
  },
  {
    quote:
      'Before we share posts to Postwick, Cadence gives us a clear brand voice and messaging angles. It’s the fastest way to know if a site is ready to promote.',
    name: 'Growth lead',
    role: 'Product',
    company: 'Postwick',
  },
];
