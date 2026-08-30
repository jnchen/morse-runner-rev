import { useEffect } from 'react';

/**
 * Keep the mobile application shell inside the visual viewport while the
 * software keyboard is open. Browsers that already resize the layout viewport
 * report no inset and remain unchanged; iOS and some Android PWAs need this
 * explicit height adjustment so the bottom action bar stays visible.
 */
export function useMobileVisualViewport() {
  useEffect(() => {
    const root = document.documentElement;
    const mobile = window.matchMedia('(max-width: 1023px)');
    let frame = 0;

    const clear = () => {
      root.style.removeProperty('--app-visible-height');
      root.dataset.keyboardOpen = 'false';
    };

    const sync = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = 0;
        const viewport = window.visualViewport;
        if (!mobile.matches || !viewport || viewport.scale > 1.01) {
          clear();
          return;
        }

        const keyboardInset = Math.max(0, window.innerHeight - viewport.height);
        if (keyboardInset > 24) {
          root.style.setProperty('--app-visible-height', `${viewport.height}px`);
          root.dataset.keyboardOpen = 'true';
          const active = document.activeElement;
          if (active instanceof HTMLElement) active.scrollIntoView({ block: 'nearest' });
        } else {
          clear();
        }
      });
    };

    sync();
    window.visualViewport?.addEventListener('resize', sync);
    window.visualViewport?.addEventListener('scroll', sync);
    window.addEventListener('resize', sync);
    window.addEventListener('orientationchange', sync);
    mobile.addEventListener('change', sync);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.visualViewport?.removeEventListener('resize', sync);
      window.visualViewport?.removeEventListener('scroll', sync);
      window.removeEventListener('resize', sync);
      window.removeEventListener('orientationchange', sync);
      mobile.removeEventListener('change', sync);
      clear();
    };
  }, []);
}
