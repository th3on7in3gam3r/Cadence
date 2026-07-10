/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EmailDraft } from '../types';

const EMAIL_SECTION_PATTERNS = [
  /email\s*1|welcome|first\s*email/i,
  /email\s*2|narrative|problem|second\s*email/i,
  /email\s*3|urgent|offer|final|third\s*email/i,
  /newsletter|broadcast|digest/i,
];

function extractField(block: string, patterns: RegExp[]): string {
  for (const pattern of patterns) {
    const match = block.match(
      new RegExp(`(?:^|\\n)\\s*(?:#{1,3}\\s*)?(?:\\*\\*)?${pattern.source}(?:\\*\\*)?\\s*:?\\s*([^\\n]+)`, 'im')
    );
    if (match?.[1]) return match[1].trim();
  }
  return '';
}

function parseBlock(block: string, label: string, id: string): EmailDraft {
  const subject = extractField(block, [/subject\s*line?/i, /subject/i]);
  const previewText = extractField(block, [/preview\s*text/i, /preheader/i, /preview/i]);
  const ctaMatch = block.match(/(?:cta|call\s*to\s*action|button)\s*:?\s*([^\n]+)/i);
  const cta = ctaMatch?.[1]?.trim() || '';

  let body = block
    .replace(/^#{1,3}\s+[^\n]+\n?/gm, '')
    .replace(/^\s*(?:subject|preview|preheader|cta|call to action)[^\n]*\n?/gim, '')
    .trim();

  if (!body) body = block.trim();

  return {
    id,
    label,
    subject: subject || `${label} — Subject line TBD`,
    previewText: previewText || body.slice(0, 90).replace(/\n/g, ' ') + (body.length > 90 ? '…' : ''),
    body,
    cta: cta || 'Learn more →',
  };
}

export function parseEmailSequence(content: string): EmailDraft[] {
  if (!content?.trim()) {
    return [
      {
        id: 'email-1',
        label: 'Email 1',
        subject: 'Welcome — add your subject',
        previewText: 'Preview text appears in the inbox snippet…',
        body: 'Your welcome email body will render here once content is generated.',
        cta: 'Get started',
      },
    ];
  }

  const chunks: { label: string; id: string; text: string }[] = [];
  const headerSplits = content.split(/(?=^#{1,3}\s+|^Email\s*\d|^Newsletter)/im);

  if (headerSplits.length > 1) {
    headerSplits.forEach((chunk, i) => {
      const trimmed = chunk.trim();
      if (!trimmed) return;
      const titleMatch = trimmed.match(/^(?:#{1,3}\s+)?(Email\s*\d[^\n]*|Newsletter[^\n]*)/i);
      const label = titleMatch?.[1]?.trim() || `Email ${i + 1}`;
      chunks.push({ label, id: `email-${i + 1}`, text: trimmed });
    });
  } else {
    const byEmail = content.split(/(?=Email\s*\d)/i).filter(Boolean);
    if (byEmail.length > 1) {
      byEmail.forEach((chunk, i) => {
        chunks.push({
          label: `Email ${i + 1}`,
          id: `email-${i + 1}`,
          text: chunk.trim(),
        });
      });
    } else {
      chunks.push({ label: 'Newsletter', id: 'newsletter-1', text: content });
    }
  }

  if (chunks.length === 0) {
    chunks.push({ label: 'Email 1', id: 'email-1', text: content });
  }

  return chunks.map((c) => parseBlock(c.text, c.label, c.id));
}

export function subjectLineScore(subject: string): { score: number; label: string; tips: string[] } {
  const len = subject.length;
  const tips: string[] = [];
  let score = 70;

  if (len >= 30 && len <= 55) {
    score += 15;
  } else {
    tips.push(len < 30 ? 'Consider 30–55 characters for mobile visibility.' : 'Shorten to avoid truncation on mobile.');
  }
  if (/[?!]/.test(subject)) score += 5;
  if (/\d|%|free|save|new/i.test(subject)) score += 5;
  if (subject === subject.toUpperCase() && subject.length > 5) {
    score -= 20;
    tips.push('Avoid ALL CAPS — it triggers spam filters.');
  }

  score = Math.min(98, Math.max(20, score));
  const label = score >= 85 ? 'Strong' : score >= 65 ? 'Good' : 'Needs work';
  return { score, label, tips };
}
