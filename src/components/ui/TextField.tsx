/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface TextFieldProps {
  id: string;
  label: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'url';
  required?: boolean;
  hint?: string;
  mono?: boolean;
  className?: string;
}

export default function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required,
  hint,
  mono,
  className = '',
}: TextFieldProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-2">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`cmo-input w-full h-11 px-4 rounded-xl border text-sm transition-all
          bg-slate-950/80 border-slate-700/80 text-slate-100 placeholder:text-slate-600
          hover:border-slate-600 hover:bg-slate-950
          focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/15
          ${mono ? 'font-mono' : 'font-medium'}`}
      />
      {hint && <p className="mt-1.5 text-[11px] text-slate-500 leading-snug">{hint}</p>}
    </div>
  );
}
