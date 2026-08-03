import { useEffect, useState } from 'react';

export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 860);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 860px)');
    const onChange = (e) => setIsDesktop(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return isDesktop;
}
