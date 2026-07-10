/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PERSONA_OPTIONS } from '../lib/studioHub';

export default function PersonaSection() {
  return (
    <section id="personas" className="py-20 md:py-28 border-b border-slate-800 scroll-mt-16 bg-slate-900/20">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs font-mono text-amber-400 uppercase tracking-wider">Who is this for?</p>
          <h2 className="mt-3 text-3xl md:text-4xl font-display font-extrabold text-white">
            Pick your path in the studio
          </h2>
          <p className="mt-4 text-slate-400 text-sm leading-relaxed">
            Same family of products — different starting points. The studio hub recommends a product and bundle for your role.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PERSONA_OPTIONS.map((persona) => (
            <Link
              key={persona.id}
              to={`/studio#persona`}
              className="group p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-colors"
            >
              <h3 className="text-base font-display font-bold text-white group-hover:text-amber-100">
                {persona.label}
              </h3>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">{persona.description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-amber-400">
                Find your fit
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          ))}
        </div>

        <p className="mt-10 text-center">
          <Link
            to="/studio"
            className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-xl transition"
          >
            Open full studio hub
            <ArrowRight className="w-4 h-4" />
          </Link>
        </p>
      </div>
    </section>
  );
}
