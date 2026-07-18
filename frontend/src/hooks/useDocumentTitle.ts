import { useEffect } from 'react';

export function useDocumentTitle(title: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = title.includes('OeniVault') ? title : `${title} · OeniVault AI`;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
