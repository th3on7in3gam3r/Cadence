/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, Search, Users, FileText, Lightbulb, Zap, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WebsiteAnalysis } from '../types';

interface Specialist {
  id: string;
  name: string;
  title: string;
  roleDescription: string;
  icon: React.ReactNode;
  color: string;
  tipGenerator: (analysis: WebsiteAnalysis) => string;
  actionLabel: string;
}

const SPECIALISTS: Specialist[] = [
  {
    id: 'sarah',
    name: 'Sarah Vance',
    title: 'Marketing strategist',
    roleDescription: 'Big-picture growth, your brand message, and what to focus on first.',
    icon: <Users className="w-4 h-4" />,
    color: 'indigo',
    tipGenerator: (analysis) => 
      `Excellent foundation! For ${analysis.brandName}, our immediate focus is the positioning statement: "${analysis.tagline}". We must align all organic social and email outreach to address our primary audience segment with high-integrity consistency.`,
    actionLabel: 'View your action plan',
  },
  {
    id: 'kofi',
    name: 'Kofi Pierce',
    title: 'SEO specialist',
    roleDescription: 'Getting found on Google and in AI search tools like ChatGPT and Perplexity.',
    icon: <Search className="w-4 h-4" />,
    color: 'emerald',
    tipGenerator: (analysis) => 
      `GEO alert! To rank on Gemini and Perplexity search indexes, we should optimize our H2 tags. For ${analysis.brandName}, writing direct, long-form responses about our audience's key pain points behaves like high-value semantic honey.`,
    actionLabel: 'Open SEO Agent',
  },
  {
    id: 'maya',
    name: 'Maya Lin',
    title: 'Sales & conversions',
    roleDescription: 'Turning visitors into sign-ups and customers with better offers and pages.',
    icon: <Zap className="w-4 h-4" />,
    color: 'amber',
    tipGenerator: (analysis) => 
      `Let's plug the leaks. Our assessment of ${analysis.brandName} shows we can maximize conversions by pitching a highly-practical custom Lead Magnet. Let's focus on an instant outcome rather than generic brochures.`,
    actionLabel: 'Create lead magnet',
  },
  {
    id: 'devon',
    name: 'Devon Miller',
    title: 'Social & email writer',
    roleDescription: 'Posts, newsletters, and making sure everything sounds like your brand.',
    icon: <FileText className="w-4 h-4" />,
    color: 'red',
    tipGenerator: (analysis) => 
      `Tone match established! I have fine-tuned our engine to speak in the elegant "${analysis.inferredBrandVoice}" voice. Every newsletter and tweet thread is optimized to convey high-concept expertise without sounding spammy.`,
    actionLabel: 'Draft a blog post',
  },
];

interface CmoCardProps {
  analysis: WebsiteAnalysis;
  selectedSpecialistId: string;
  onSelectSpecialist: (id: string) => void;
  onSpecialistAction: (id: string) => void;
}

export default function CmoCard({
  analysis,
  selectedSpecialistId,
  onSelectSpecialist,
  onSpecialistAction,
}: CmoCardProps) {
  const activeSpecialist = SPECIALISTS.find(s => s.id === selectedSpecialistId) || SPECIALISTS[0];

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-lg p-5 md:p-6 mb-8">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Your AI marketing team
          </h3>
          <p className="text-xs text-slate-400">Pick a specialist — then start their recommended next step</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {SPECIALISTS.map((s) => {
          const isSelected = s.id === selectedSpecialistId;
          return (
            <button
              id={`specialist-tab-${s.id}`}
              key={s.id}
              type="button"
              onClick={() => onSelectSpecialist(s.id)}
              className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-800 border-emerald-500/40 text-white shadow-md shadow-emerald-500/5'
                  : 'bg-slate-950 border-slate-800 hover:bg-slate-800/80 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`p-1 rounded ${
                  isSelected ? 'bg-slate-900 text-emerald-400 border border-slate-800' : 'bg-slate-900 border border-slate-800 text-slate-400'
                }`}>
                  {s.icon}
                </div>
                <span className="text-[10px] font-mono font-semibold uppercase tracking-tight text-slate-400">
                  {s.id === 'sarah' ? 'Strategy' : s.id === 'kofi' ? 'SEO' : s.id === 'maya' ? 'Sales' : 'Writing'}
                </span>
              </div>
              <h4 className="text-sm font-display font-bold truncate leading-tight">{s.name}</h4>
              <p className={`text-[10px] truncate ${isSelected ? 'text-slate-300' : 'text-slate-505'}`}>
                {s.title}
              </p>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeSpecialist.id}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.2 }}
          className="p-4 bg-slate-950 border border-slate-800 rounded-xl"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-amber-400 shadow-sm font-mono text-center flex-shrink-0">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-display font-bold text-white">{activeSpecialist.name}</span>
                <span className="text-[10px] text-slate-500 font-mono">({activeSpecialist.title})</span>
              </div>
              <p className="text-xs text-slate-300 italic leading-relaxed">
                &ldquo;{activeSpecialist.tipGenerator(analysis)}&rdquo;
              </p>
              <button
                type="button"
                id={`specialist-action-${activeSpecialist.id}`}
                onClick={() => onSpecialistAction(activeSpecialist.id)}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition cursor-pointer"
              >
                {activeSpecialist.actionLabel}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
