/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { gradeAccentClass } from '../../utils/campaignReadiness';

interface ReadinessRingProps {
  grade: string;
  score: number;
  strokeColor: string;
  ringRadius?: number;
  size?: 'compact' | 'full';
}

export default function ReadinessRing({
  grade,
  score,
  strokeColor,
  ringRadius = 54,
  size = 'full',
}: ReadinessRingProps) {
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - score / 100);
  const dim = size === 'compact' ? 'w-20 h-20' : 'w-36 h-36';
  const gradeText = size === 'compact' ? 'text-2xl' : 'text-4xl';
  const scoreText = size === 'compact' ? 'text-sm' : 'text-lg';
  const gradeColor = gradeAccentClass(grade);

  return (
    <div className={`relative ${dim} flex items-center justify-center shrink-0`}>
      <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={ringRadius} stroke="#1e293b" strokeWidth="8" fill="transparent" />
        <circle
          cx="60"
          cy="60"
          r={ringRadius}
          stroke={strokeColor}
          strokeWidth="8"
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={ringCircumference}
          strokeDashoffset={ringOffset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="relative text-center z-10">
        <p className={`${gradeText} font-display font-black leading-none ${gradeColor}`}>{grade}</p>
        <p className={`${scoreText} font-mono font-bold text-white mt-0.5`}>{score}%</p>
      </div>
    </div>
  );
}
