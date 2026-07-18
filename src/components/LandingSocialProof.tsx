/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Quote } from 'lucide-react';
import { TESTIMONIALS } from '../data/landingSocialProof';
import StarRating from './landing/StarRating';

export default function LandingSocialProof() {
  return (
    <section className="border-b border-slate-800 bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-10 md:py-12">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.35 }}
          className="text-center text-xl md:text-2xl font-display font-extrabold text-white mb-8"
        >
          What teams are saying
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-4">
          {TESTIMONIALS.map((item, index) => (
            <motion.blockquote
              key={`${item.company}-${item.name}`}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.35, delay: index * 0.06 }}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col"
            >
              <div className="flex items-center justify-between mb-3">
                <Quote className="w-5 h-5 text-emerald-500/60 shrink-0" aria-hidden />
                <StarRating rating={item.rating} />
              </div>
              <p className="text-sm text-slate-300 leading-relaxed flex-1">&ldquo;{item.quote}&rdquo;</p>
              <footer className="mt-4 pt-4 border-t border-slate-800/80">
                <p className="text-xs font-semibold text-white">{item.name}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {item.role}, {item.company}
                </p>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
