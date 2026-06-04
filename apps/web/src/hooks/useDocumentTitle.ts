import { useEffect } from 'react';

/**
 * Set the document title. Restores the default title on unmount.
 */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    const prev = document.title;
    document.title = title
      ? `${title} — HireGuard`
      : 'HireGuard — Open Recruiter Verification Protocol';
    return () => {
      document.title = prev;
    };
  }, [title]);
}
