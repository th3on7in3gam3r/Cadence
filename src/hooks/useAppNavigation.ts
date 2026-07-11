/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MarketingAssetType } from '../types';
import { AppView, buildAppPath, parseAppPath, slugifyBrandId } from '../lib/appPaths';
import type { HelpSectionId } from '../lib/helpSections';

export function useAppNavigation(
  brandUrl: string,
  setActiveView: (v: AppView) => void,
  setActiveAssetType?: (t: MarketingAssetType | null) => void
) {
  const navigate = useNavigate();
  const location = useLocation();
  const brandId = slugifyBrandId(brandUrl);

  useEffect(() => {
    if (!location.pathname.startsWith('/app')) return;
    const parsed = parseAppPath(location.pathname);
    setActiveView(parsed.view);
    if (parsed.assetType && setActiveAssetType) {
      setActiveAssetType(parsed.assetType as MarketingAssetType);
    }
  }, [location.pathname, setActiveView, setActiveAssetType]);

  const navigateTo = useCallback(
    (view: AppView, opts?: { assetType?: MarketingAssetType; replace?: boolean; helpSection?: HelpSectionId }) => {
      setActiveView(view);
      if (opts?.assetType && setActiveAssetType) {
        setActiveAssetType(opts.assetType);
      }
      const path = buildAppPath(view, brandId, {
        assetType: opts?.assetType,
        helpSection: opts?.helpSection,
      });
      navigate(path, { replace: opts?.replace });
    },
    [brandId, navigate, setActiveView, setActiveAssetType]
  );

  return { navigateTo, brandId, pathname: location.pathname };
}
