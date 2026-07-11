/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type HelpSectionId = 'overview' | 'start' | 'post' | 'map';

export interface HelpSectionMeta {
  id: HelpSectionId;
  label: string;
  shortLabel: string;
  description: string;
}

export const HELP_SECTIONS: HelpSectionMeta[] = [
  {
    id: 'overview',
    label: 'Quick answers',
    shortLabel: 'Overview',
    description: 'Common questions at a glance',
  },
  {
    id: 'start',
    label: 'Getting started',
    shortLabel: 'Start',
    description: 'First audit and the 3-step workflow',
  },
  {
    id: 'post',
    label: 'How to post',
    shortLabel: 'Post',
    description: 'Publish a blog to WordPress',
  },
  {
    id: 'map',
    label: 'Site map',
    shortLabel: 'Map',
    description: 'Where everything lives',
  },
];

export function isHelpSectionId(value: string | null): value is HelpSectionId {
  return value === 'overview' || value === 'start' || value === 'post' || value === 'map';
}

export function buildHelpPath(section?: HelpSectionId): string {
  return section ? `/app/help?section=${section}` : '/app/help';
}
