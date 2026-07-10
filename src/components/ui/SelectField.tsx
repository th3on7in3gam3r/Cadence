/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps {
  id: string;
  label: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  hint?: string;
  className?: string;
  /** Hide empty placeholder row when a value is always selected */
  hidePlaceholder?: boolean;
  disabled?: boolean;
}

export default function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = 'Select one…',
  required,
  hint,
  className = '',
  hidePlaceholder = false,
  disabled = false,
}: SelectFieldProps) {
  const isPlaceholder = !value;

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-2">
        {label}
      </label>
      <div className="relative group">
        <select
          id={id}
          value={value}
          required={required}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className={`cmo-select w-full h-11 pl-4 pr-10 rounded-xl border text-sm font-medium transition-all cursor-pointer
            bg-slate-950/80 border-slate-700/80
            hover:border-slate-600 hover:bg-slate-950
            focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/15
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-slate-700/80
            ${isPlaceholder ? 'text-slate-500' : 'text-slate-100'}`}
        >
          <option value="" disabled={required} hidden={hidePlaceholder}>
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span
          className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-500 group-hover:text-slate-400 group-focus-within:text-emerald-400/80 transition-colors"
          aria-hidden
        >
          <ChevronDown className="w-4 h-4 stroke-[2.5]" />
        </span>
      </div>
      {hint && <p className="mt-1.5 text-[11px] text-slate-500 leading-snug">{hint}</p>}
    </div>
  );
}
