/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface ReportScores {
  overallScore: number;
  technicalScore: number;
  contentScore: number;
  keywordScore: number;
  executiveSummary: string;
  keywordGaps?: { keyword: string; opportunityScore?: number; intent?: string }[];
  optimizationRoadmap?: { phase: number; title: string; estimatedLiftPercent?: number }[];
}

export interface SeoReportBranding {
  agencyName?: string;
  agencyLogoUrl?: string;
  clientName: string;
  siteUrl: string;
  generatedAt?: string;
}

export function buildSeoAuditReportHtml(
  audit: ReportScores,
  branding: SeoReportBranding
): string {
  const date = branding.generatedAt || new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const logo = branding.agencyLogoUrl
    ? `<img src="${escapeHtml(branding.agencyLogoUrl)}" alt="" style="max-height:48px;max-width:180px" />`
    : '';
  const agency = branding.agencyName
    ? `<div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.08em">${escapeHtml(branding.agencyName)}</div>`
    : '';

  const gaps = (audit.keywordGaps || []).slice(0, 8).map(
    (g) => `<tr><td>${escapeHtml(g.keyword)}</td><td>${g.opportunityScore ?? '—'}%</td><td>${escapeHtml(g.intent || '')}</td></tr>`
  ).join('');

  const roadmap = (audit.optimizationRoadmap || []).map(
    (p) => `<li><strong>Phase ${p.phase}:</strong> ${escapeHtml(p.title)}${p.estimatedLiftPercent ? ` (+${p.estimatedLiftPercent}% est.)` : ''}</li>`
  ).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>SEO Audit — ${escapeHtml(branding.clientName)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, Segoe UI, sans-serif; color: #0f172a; margin: 0; padding: 40px; line-height: 1.5; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e2e8f0; padding-bottom: 24px; margin-bottom: 32px; }
    h1 { font-size: 28px; margin: 8px 0 4px; }
    .meta { color: #64748b; font-size: 13px; }
    .scores { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
    .score { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; text-align: center; }
    .score .val { font-size: 32px; font-weight: 800; color: #059669; }
    .score .lbl { font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: .06em; }
    section { margin-bottom: 28px; }
    h2 { font-size: 14px; text-transform: uppercase; letter-spacing: .08em; color: #475569; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; }
    th { background: #f8fafc; }
    ul { margin: 0; padding-left: 20px; }
    .summary { background: #f8fafc; border-radius: 12px; padding: 20px; font-size: 14px; }
    @media print { body { padding: 24px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      ${agency}
      <h1>SEO Audit Report</h1>
      <div class="meta">${escapeHtml(branding.clientName)} · ${escapeHtml(branding.siteUrl)}</div>
      <div class="meta">Generated ${escapeHtml(date)}</div>
    </div>
    <div>${logo}</div>
  </div>
  <div class="scores">
    <div class="score"><div class="val">${audit.overallScore}%</div><div class="lbl">Overall</div></div>
    <div class="score"><div class="val">${audit.technicalScore}%</div><div class="lbl">Technical</div></div>
    <div class="score"><div class="val">${audit.contentScore}%</div><div class="lbl">Content</div></div>
    <div class="score"><div class="val">${audit.keywordScore}%</div><div class="lbl">Keywords</div></div>
  </div>
  <section>
    <h2>Executive summary</h2>
    <div class="summary">${escapeHtml(audit.executiveSummary)}</div>
  </section>
  ${gaps ? `<section><h2>Top keyword gaps</h2><table><thead><tr><th>Keyword</th><th>Opportunity</th><th>Intent</th></tr></thead><tbody>${gaps}</tbody></table></section>` : ''}
  ${roadmap ? `<section><h2>Optimization roadmap</h2><ul>${roadmap}</ul></section>` : ''}
  <p style="font-size:11px;color:#94a3b8;margin-top:40px">Prepared with Cadence · Confidential client report</p>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
