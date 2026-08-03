import { usePlotMap } from './usePlotMap';
import MobileLayout from './MobileLayout';
import DesktopLayout from './DesktopLayout';
import { useIsDesktop } from './useIsDesktop';

export default function App() {
  const pm = usePlotMap();
  const isDesktop = useIsDesktop();

  return isDesktop ? <DesktopLayout pm={pm} /> : <MobileLayout pm={pm} />;
}
