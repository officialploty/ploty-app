import { useEffect, useMemo, useState } from 'react';
import { makeSeedPlots } from './data';
import { usePlotMap } from './usePlotMap';
import MobileLayout from './MobileLayout';
import DesktopLayout from './DesktopLayout';

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 860);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 860px)');
    const onChange = (e) => setIsDesktop(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return isDesktop;
}

export default function App() {
  const seed = useMemo(() => makeSeedPlots(), []);
  const pm = usePlotMap(seed);
  const isDesktop = useIsDesktop();

  return isDesktop ? <DesktopLayout pm={pm} /> : <MobileLayout pm={pm} />;
}
