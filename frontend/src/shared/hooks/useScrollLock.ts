import { useEffect } from 'preact/hooks';

/**
 * Custom hook to block body scroll when a component (like a modal) is active.
 * @param isLocked - Boolean that determines if the scroll should be blocked. Defaults to true.
 */
export function useScrollLock(isLocked: boolean = true) {
  useEffect(() => {
    if (!isLocked) return;

    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isLocked]);
}
