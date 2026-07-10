/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DiffPart = { type: 'added' | 'removed' | 'unchanged'; value: string };

export function computeWordDiff(text1: string, text2: string): DiffPart[] {
  const words1 = text1 ? text1.split(/(\s+)/) : [];
  const words2 = text2 ? text2.split(/(\s+)/) : [];

  const dp: number[][] = Array(words1.length + 1)
    .fill(0)
    .map(() => Array(words2.length + 1).fill(0));
  for (let i = 1; i <= words1.length; i++) {
    for (let j = 1; j <= words2.length; j++) {
      if (words1[i - 1] === words2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const diffResult: DiffPart[] = [];
  let i = words1.length;
  let j = words2.length;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && words1[i - 1] === words2[j - 1]) {
      diffResult.unshift({ type: 'unchanged', value: words1[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diffResult.unshift({ type: 'added', value: words2[j - 1] });
      j--;
    } else {
      diffResult.unshift({ type: 'removed', value: words1[i - 1] });
      i--;
    }
  }
  return diffResult;
}
