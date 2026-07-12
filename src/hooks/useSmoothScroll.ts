/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function useSmoothScroll(enabled: boolean = true) {
  const location = useLocation();

  useEffect(() => {
    if (!enabled) return;

    const overrideGlobalScrollUtilities = () => {
      (window as any).__instantScrollTo = (targetPos: number) => {
        window.scrollTo({ top: targetPos, behavior: 'auto' });
      };

      (window as any).__smoothScrollTo = (targetPos: number) => {
        window.scrollTo({ top: targetPos, behavior: 'smooth' });
      };
    };

    overrideGlobalScrollUtilities();

    return () => {
      delete (window as any).__instantScrollTo;
      delete (window as any).__smoothScrollTo;
    };
  }, [enabled]);

  // Instantly halt any active smooth scrolling when the route changes.
  // This prevents background scroll animations from clashing with page exit transitions,
  // resolving layout thrashing and AnimatePresence state crashes.
  useEffect(() => {
    if (!enabled) return;
    try {
      window.scrollTo({ top: window.scrollY, behavior: 'auto' });
    } catch (e) {
      console.warn('Failed to abort active scroll transition on route change', e);
    }
  }, [location.pathname, enabled]);
}

