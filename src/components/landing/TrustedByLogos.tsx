/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TRUSTED_BY, type TrustedBrand } from '../../data/landingSocialProof';

function BrandLogo({ brand }: { brand: TrustedBrand }) {
  const [failed, setFailed] = useState(false);

  const pillClass =
    'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold text-slate-300 border border-slate-800 bg-slate-900/80 opacity-70 hover:opacity-100 transition';

  const logoImg = (
    <img
      src={brand.logoSrc}
      alt={brand.logoAlt}
      className="h-5 md:h-6 w-auto object-contain text-slate-400 opacity-60 hover:opacity-100 transition"
      onError={() => setFailed(true)}
    />
  );

  const content = failed ? <span className={pillClass}>{brand.name}</span> : logoImg;

  if (brand.href) {
    return (
      <a
        href={brand.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Visit ${brand.name}`}
        className="inline-flex items-center"
      >
        {content}
      </a>
    );
  }

  return <span className="inline-flex items-center">{content}</span>;
}

export default function TrustedByLogos() {
  return (
    <div className="text-center">
      <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-4">
        Trusted by teams at
      </p>
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 md:gap-x-8 text-slate-400">
        {TRUSTED_BY.map((brand) => (
          <div key={brand.name}>
            <BrandLogo brand={brand} />
          </div>
        ))}
      </div>
    </div>
  );
}
