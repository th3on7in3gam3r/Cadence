/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function isSchemaNotReadyError(e: unknown): boolean {
  const code = (e as { code?: string })?.code;
  const msg = e instanceof Error ? e.message : String(e);
  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    /does not exist/i.test(msg) ||
    /schema cache/i.test(msg) ||
    /relation.*not found/i.test(msg)
  );
}

export function schemaSetupHint(): string {
  return 'Run supabase/schema.sql through schema-v5-pulse-claims.sql in your Supabase SQL Editor.';
}
