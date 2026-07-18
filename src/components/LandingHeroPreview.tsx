/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { BarChart3, FileText, Search } from 'lucide-react';

const SCREENSHOT_SRC = '/landing/cadence-dashboard.webp';

export default function LandingHeroPreview() {
  const [hasScreenshot, setHasScreenshot] = useState(false);
  const [typedUrl, setTypedUrl] = useState('');

  useEffect(() => {
    const img = new Image();
    img.onload = () => setHasScreenshot(true);
    img.onerror = () => setHasScreenshot(false);
    img.src = SCREENSHOT_SRC;
  }, []);

  useEffect(() => {
    if (hasScreenshot) return;
    const target = 'https://yourbrand.com';
    let i = 0;
    const timer = window.setInterval(() => {
      i += 1;
      setTypedUrl(target.slice(0, i));
      if (i >= target.length) window.clearInterval(timer);
    }, 55);
    return () => window.clearInterval(timer);
  }, [hasScreenshot]);

  if (hasScreenshot) {
    return (
      <div className="relative w-full max-w-lg mx-auto lg:mx-0">
        <div className="rounded-2xl border border-slate-700/80 bg-slate-900 p-2 shadow-2xl shadow-emerald-950/30">
          <img
            src={SCREENSHOT_SRC}
            alt="Cadence marketing dashboard"
            className="w-full rounded-xl border border-slate-800"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-lg mx-auto lg:mx-0">
      <div className="rounded-2xl border border-slate-700/80 bg-slate-900 shadow-2xl shadow-emerald-950/30 overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-950 border-b border-slate-800">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          <span className="ml-2 flex-1 text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800 rounded px-2 py-1 truncate">
            {typedUrl || 'https://'}
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="inline-block w-0.5 h-3 bg-emerald-400 ml-0.5 align-middle"
            />
          </span>
        </div>
        <div className="p-4 space-y-3 bg-gradient-to-b from-slate-900 to-slate-950">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-3 rounded-xl bg-slate-950 border border-slate-800"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono text-slate-500 uppercase">Campaign readiness</span>
              <BarChart3 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="mt-2 text-2xl font-display font-black text-white">B+ 78%</p>
            <p className="text-[10px] text-slate-500 mt-1">Strategy · audience · channel plan</p>
          </motion.div>
          <div className="grid grid-cols-2 gap-2">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800"
            >
              <Search className="w-4 h-4 text-teal-400 mb-2" />
              <p className="text-xs font-bold text-white">SEO Agent</p>
              <p className="text-[10px] text-slate-500 mt-0.5">12 issues found</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
              className="p-3 rounded-xl bg-slate-950 border border-slate-800"
            >
              <FileText className="w-4 h-4 text-blue-400 mb-2" />
              <p className="text-xs font-bold text-white">Content studio</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Blog · email · social</p>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-900/40 text-[10px] font-mono text-emerald-300"
          >
            <span className="text-emerald-400">→</span> Analyzing site content…
          </motion.div>
        </div>
      </div>
    </div>
  );
}
