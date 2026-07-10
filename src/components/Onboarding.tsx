/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PRODUCT_NAME, PRODUCT_SUBTITLE } from '../lib/brand';
import {
  Sparkles, Globe, BrainCircuit, Target, Megaphone, ArrowRight,
  ShieldAlert, Laptop, User, ChevronRight,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import {
  HEARD_FROM_OPTIONS,
  isUserSetupComplete,
  loadUserSetup,
  saveUserSetup,
} from '../utils/userSetup';
import SelectField from './ui/SelectField';
import TextField from './ui/TextField';

const ROLE_OPTIONS = [
  { value: 'Founder / CEO', label: 'Founder / CEO' },
  { value: 'Marketing lead', label: 'Marketing lead' },
  { value: 'Agency / consultant', label: 'Agency / consultant' },
  { value: 'Freelancer', label: 'Freelancer' },
  { value: 'Other', label: 'Other' },
];

const HEARD_OPTIONS = HEARD_FROM_OPTIONS.map((opt) => ({ value: opt, label: opt }));

const GOAL_OPTIONS = [
  { value: '10x Organic Lead Capture & Conversions', label: '10x Organic Lead Capture & Conversions' },
  { value: 'Inbound SEO Ranking & Traffic', label: 'Inbound SEO Ranking & Traffic' },
  { value: 'Social Media Authority Building', label: 'Social Media Authority Building' },
  { value: 'Product Pitch & Launch Strategy', label: 'Product Pitch & Launch Strategy' },
  { value: 'E-commerce Conversion Tuning', label: 'E-commerce Conversion Tuning' },
];

const VOICE_OPTIONS = [
  { value: 'Inferred from website content', label: 'Inferred from website content' },
  { value: 'Sincere, Trustworthy & Warm', label: 'Sincere, Trustworthy & Warm' },
  { value: 'Witty, Intellectual & Sharp', label: 'Witty, Intellectual & Sharp' },
  { value: 'Minimalist & High-End Editorial', label: 'Minimalist & High-End Editorial' },
  { value: 'Bold, Direct & Disruptive', label: 'Bold, Direct & Disruptive' },
  { value: 'Playful, Colorful & Youthful', label: 'Playful, Colorful & Youthful' },
];

type OnboardingStep = 'welcome' | 'brand';

interface OnboardingProps {
  onAnalyze: (config: {
    url: string;
    goal: string;
    brandVoice: string;
    customChallenge: string;
  }) => void;
  isLoading: boolean;
  apiKeyConfigured: boolean;
  hostedAi?: boolean;
}

const PRESETS = [
  {
    name: 'EcoBite',
    url: 'https://ecobite.organic',
    tagline: 'Farm-to-Door Zero-Waste Organic Meal Kits',
    goal: '10x Organic Lead Capture & Conversions',
    brandVoice: 'Sincere, Trustworthy & Warm',
    customChallenge: 'Traditional ads are too expensive. We need organic content marketing strategy to scale local subscriptions.',
  },
  {
    name: 'PulseFlow',
    url: 'https://pulseflow.io',
    tagline: 'Instant Real-time API & Microservices Monitoring',
    goal: 'Inbound SEO Ranking & Traffic',
    brandVoice: 'Witty, Intellectual & Sharp',
    customChallenge: 'Hard to stand out from giant competitors. Need high-level developer SEO content strategy and GEO optimizations.',
  },
  {
    name: 'SolaSleep',
    url: 'https://solasleep.co',
    tagline: 'Premium bamboo weighted bedding for clinical insomniacs',
    goal: 'Product Pitch & Launch Strategy',
    brandVoice: 'Minimalist & High-End Editorial',
    customChallenge: 'High cart-abandonment rate. We need high-converting landing page lead magnets and nurturing email sequences.',
  },
];

export default function Onboarding({ onAnalyze, isLoading, apiKeyConfigured, hostedAi }: OnboardingProps) {
  const { user } = useAuth();
  const savedSetup = loadUserSetup();
  const [step, setStep] = useState<OnboardingStep>(
    isUserSetupComplete(user) ? 'brand' : 'welcome'
  );
  const [fullName, setFullName] = useState(
    savedSetup?.fullName || user?.user_metadata?.full_name || ''
  );
  const [role, setRole] = useState(savedSetup?.role || '');
  const [heardFrom, setHeardFrom] = useState(savedSetup?.heardFrom || '');
  const [heardFromDetail, setHeardFromDetail] = useState(savedSetup?.heardFromDetail || '');
  const [setupError, setSetupError] = useState<string | null>(null);
  const [savingSetup, setSavingSetup] = useState(false);

  const [url, setUrl] = useState('');
  const [goal, setGoal] = useState('10x Organic Lead Capture & Conversions');
  const [brandVoice, setBrandVoice] = useState('Inferred from website content');
  const [customChallenge, setCustomChallenge] = useState('');

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    if (!newUrl) return;

    const lower = newUrl.toLowerCase();
    
    // 1. SaaS / Technical Platforms / APIs / Monitoring
    if (
      lower.includes('api') || 
      lower.includes('io') || 
      lower.includes('dev') || 
      lower.includes('tech') || 
      lower.includes('monitoring') || 
      lower.includes('software') || 
      lower.includes('cloud') || 
      lower.includes('pulseflow') || 
      lower.includes('pulse') || 
      lower.includes('flow') ||
      lower.includes('system') ||
      lower.includes('server')
    ) {
      setGoal('Inbound SEO Ranking & Traffic');
      setBrandVoice('Witty, Intellectual & Sharp');
    }
    // 2. High-end, Bedding, Luxury, Editorial, Sleep, Fashion, Design
    else if (
      lower.includes('sleep') || 
      lower.includes('bed') || 
      lower.includes('luxury') || 
      lower.includes('premium') || 
      lower.includes('solasleep') || 
      lower.includes('editorial') || 
      lower.includes('style') || 
      lower.includes('fashion') ||
      lower.includes('sola') ||
      lower.includes('bamboo') ||
      lower.includes('design')
    ) {
      setGoal('Product Pitch & Launch Strategy');
      setBrandVoice('Minimalist & High-End Editorial');
    }
    // 3. Organic, Eco, Food, Meal kits, EcoBite, Green, Bio
    else if (
      lower.includes('eco') || 
      lower.includes('organic') || 
      lower.includes('bite') || 
      lower.includes('meal') || 
      lower.includes('kit') || 
      lower.includes('green') || 
      lower.includes('farm') || 
      lower.includes('nature') || 
      lower.includes('health') || 
      lower.includes('food') ||
      lower.includes('ecobite')
    ) {
      setGoal('10x Organic Lead Capture & Conversions');
      setBrandVoice('Sincere, Trustworthy & Warm');
    }
    // 4. Social networks, Agencies, Viral, Playful, Youth, Gaming, Buzz
    else if (
      lower.includes('social') || 
      lower.includes('media') || 
      lower.includes('viral') || 
      lower.includes('buzz') || 
      lower.includes('influence') || 
      lower.includes('play') || 
      lower.includes('youth') || 
      lower.includes('game') || 
      lower.includes('fun') || 
      lower.includes('agency') ||
      lower.includes('branding') ||
      lower.includes('creative')
    ) {
      setGoal('Social Media Authority Building');
      setBrandVoice('Playful, Colorful & Youthful');
    }
    // 5. Stores, E-commerce, Retailers, Products, Direct-to-Consumer
    else if (
      lower.includes('shop') || 
      lower.includes('store') || 
      lower.includes('buy') || 
      lower.includes('cart') || 
      lower.includes('ecom') || 
      lower.includes('commerce') || 
      lower.includes('market') || 
      lower.includes('sale') || 
      lower.includes('pay') || 
      lower.includes('checkout') || 
      lower.includes('deal') ||
      lower.includes('product')
    ) {
      setGoal('E-commerce Conversion Tuning');
      setBrandVoice('Bold, Direct & Disruptive');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    onAnalyze({ url, goal, brandVoice, customChallenge });
  };

  const selectPreset = (preset: typeof PRESETS[0]) => {
    setUrl(preset.url);
    setGoal(preset.goal);
    setBrandVoice(preset.brandVoice);
    setCustomChallenge(preset.customChallenge);
  };

  const handleWelcomeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!heardFrom) {
      setSetupError(`Please tell us how you heard about ${PRODUCT_NAME}.`);
      return;
    }
    if (heardFrom === 'Other' && !heardFromDetail.trim()) {
      setSetupError('Please share where you heard about us.');
      return;
    }
    setSetupError(null);
    setSavingSetup(true);
    try {
      await saveUserSetup(
        {
          fullName: fullName.trim(),
          role: role.trim(),
          heardFrom,
          heardFromDetail: heardFromDetail.trim() || undefined,
        },
        user
      );
      setStep('brand');
    } catch {
      setSetupError('Could not save your answers. Try again.');
    } finally {
      setSavingSetup(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-16">
      {/* Header section with brand personality */}
      <div className="text-center mb-10 md:mb-12">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 text-emerald-450 rounded-full text-xs font-mono mb-5"
        >
          <BrainCircuit className="w-3.5 h-3.5 animate-pulse" />
          <span>ESTABLISHED 2026 · PLATFORM ONLINE</span>
        </motion.div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6 text-[11px] font-mono">
          <span className={step === 'welcome' ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
            1. Welcome
          </span>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <span className={step === 'brand' ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
            2. Your brand
          </span>
        </div>
        
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold tracking-tight text-white mb-4 leading-[1.15] text-balance px-2"
        >
          {step === 'welcome' ? (
            <>Welcome to <span className="text-emerald-400">{PRODUCT_NAME}</span></>
          ) : (
            <>{PRODUCT_SUBTITLE}</>
          )}
        </motion.h1>

        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-sans px-2"
        >
          {step === 'welcome'
            ? 'A quick intro so we can tailor your workspace — then we’ll analyze your brand.'
            : 'Paste your website URL. We’ll build strategy, SEO insights, and launch-ready copy in one workspace.'}
        </motion.p>
      </div>

      {step === 'welcome' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg mx-auto bg-slate-900/90 rounded-2xl border border-slate-800/90 p-6 md:p-8 shadow-xl shadow-black/20"
        >
          <form onSubmit={handleWelcomeSubmit} className="space-y-5">
            <TextField
              id="onboard-name"
              label={
                <span className="inline-flex items-center gap-1.5">
                  <User className="w-4 h-4 text-slate-500" />
                  Your name
                </span>
              }
              value={fullName}
              onChange={setFullName}
              placeholder="Alex Morgan"
            />

            <SelectField
              id="onboard-role"
              label="Your role"
              value={role}
              onChange={setRole}
              options={ROLE_OPTIONS}
              placeholder="Select one (optional)"
            />

            <SelectField
              id="onboard-heard"
              label={
                <>
                  How did you hear about {PRODUCT_NAME}? <span className="text-rose-400">*</span>
                </>
              }
              value={heardFrom}
              onChange={setHeardFrom}
              options={HEARD_OPTIONS}
              placeholder="Choose a source…"
              required
              hint={`Helps us improve how people discover ${PRODUCT_NAME}.`}
            />

            {(heardFrom === 'Other' || heardFrom === 'Conference or event') && (
              <TextField
                id="onboard-heard-detail"
                label={heardFrom === 'Other' ? 'Please specify' : 'Which event? (optional)'}
                value={heardFromDetail}
                onChange={setHeardFromDetail}
                placeholder="e.g. Twitter, a podcast, SaaStr…"
              />
            )}

            {setupError && (
              <p className="text-xs text-rose-400 bg-rose-950/30 border border-rose-800/40 rounded-lg px-3 py-2">
                {setupError}
              </p>
            )}

            <button
              type="submit"
              disabled={savingSetup}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {savingSetup ? 'Saving…' : 'Continue to brand setup'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </motion.div>
      )}

      {step === 'brand' && (
        <>
      {!apiKeyConfigured && !hostedAi && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-4 bg-amber-950/40 border border-amber-800/60 rounded-xl text-amber-200 flex items-start gap-3"
        >
          <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-semibold text-amber-450 text-white">API key required (local mode):</span> Add a <code className="bg-slate-800 px-1.5 py-0.5 rounded font-mono text-emerald-300">GEMINI_API_KEY</code> to your server <code className="bg-slate-800 px-1.5 py-0.5 rounded font-mono text-emerald-300">.env.local</code>, or sign in to the hosted product where AI is included.
          </div>
        </motion.div>
      )}

      {hostedAi && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-4 bg-emerald-950/30 border border-emerald-800/50 rounded-xl text-emerald-100 flex items-start gap-3"
        >
          <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-semibold text-white">Hosted AI enabled.</span> Paste your website URL below — no API key needed.
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Main interactive Setup Form */}
        <div className="md:col-span-2 bg-slate-900 rounded-2xl shadow-lg border border-slate-800 p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-slate-800 text-emerald-400 rounded-lg border border-slate-700">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-white">Campaign Room</h2>
              <p className="text-xs text-slate-400">Configure your brand coordinates</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="url-input" className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-slate-500" />
                Website URL
              </label>
              <div className="relative">
                <input
                  id="url-input"
                  type="text"
                  placeholder="https://mybusiness.com"
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  className="cmo-input w-full h-11 px-4 rounded-xl border text-sm font-mono transition-all
                    bg-slate-950/80 border-slate-700/80 text-slate-100 placeholder:text-slate-600
                    hover:border-slate-600 focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/15"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectField
                id="goal-select"
                label={
                  <span className="inline-flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-slate-500" />
                    Primary growth objective
                  </span>
                }
                value={goal}
                onChange={setGoal}
                options={GOAL_OPTIONS}
                hidePlaceholder
              />

              <SelectField
                id="voice-select"
                label={
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-slate-500" />
                    Brand voice
                  </span>
                }
                value={brandVoice}
                onChange={setBrandVoice}
                options={VOICE_OPTIONS}
                hidePlaceholder
              />
            </div>

            <div>
              <label htmlFor="custom-challenge-input" className="block text-sm font-semibold text-slate-300 mb-1.5">
                Current Bottleneck or Challenge (Optional)
              </label>
              <textarea
                id="custom-challenge-input"
                rows={3}
                placeholder="What limits your visibility or sales right now? e.g. 'Struggling to convince users our premium value justifies our cost.'"
                value={customChallenge}
                onChange={(e) => setCustomChallenge(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all text-sm leading-relaxed"
              />
            </div>

            <button
              id="activate-cmo-btn"
              type="submit"
              disabled={isLoading || !url}
              className="w-full mt-2 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold disabled:bg-slate-800 disabled:text-slate-500 border border-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-emerald-500/10 active:scale-[0.99] transition-all"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-dashed border-white rounded-full animate-spin" />
                  <span>Activating Deep Brand Analysis...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Activate {PRODUCT_NAME} Team</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Business Presets Sidebar list */}
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 text-white font-display font-semibold text-sm mb-3">
              <Laptop className="w-4 h-4 text-slate-400" />
              <span>Instant Startup Presets</span>
            </div>
            <p className="text-xs text-slate-400 leading-normal mb-4">
              Select an idealized business profile below to witness custom structured strategy recommendations and copy outputs instantly.
            </p>

            <div className="space-y-3">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  id={`preset-${p.name.toLowerCase()}`}
                  onClick={() => selectPreset(p)}
                  className={`w-full text-left p-3 rounded-lg border transition-all text-white cursor-pointer ${
                    url === p.url
                      ? 'bg-emerald-950/30 text-emerald-300 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                      : 'bg-slate-950 hover:bg-slate-800/80 border-slate-800 shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-display font-bold text-sm tracking-tight">{p.name}</span>
                    <span className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded ${
                      url === p.url ? 'bg-emerald-900/30 text-emerald-400' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {p.name === 'EcoBite' ? 'Local kit' : p.name === 'PulseFlow' ? 'SaaS API' : 'Direct e-com'}
                    </span>
                  </div>
                  <div className={`text-xs line-clamp-1 mb-2 ${url === p.url ? 'text-emerald-200/70' : 'text-slate-400'}`}>
                    {p.tagline}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-medium text-amber-400">
                    <Sparkles className="w-3 h-3" />
                    <span>Quick Load</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl">
            <h4 className="text-xs font-semibold text-emerald-400 mb-1 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              How {PRODUCT_NAME} Research Works
            </h4>
            <p className="text-[11px] text-emerald-200/80 leading-normal">
              Our active system uses standard server-side fetching coupled with <strong>Google Search Grounding</strong>. Even if your brand is private or has robust crawler shields, search queries recover local brand details cleanly!
            </p>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
