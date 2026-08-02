import { useCallback, useMemo, useRef, useState } from 'react';
import { CITIES } from './data';
import { band, distanceMeters, NEARBY_THRESHOLD_M, num, shot } from './utils';

const emptyForm = {
  kind: 'plot', locality: '', priceMode: 'ppsf', price: '', size: '', notes: '', contact: '', media: [], amenities: [],
  plots: '', sizeMin: '', sizeMax: '', ppsfMin: '', ppsfMax: '', company: '',
};

export function usePlotMap(seedPlots) {
  const [plots, setPlots] = useState(seedPlots);
  const [tab, setTab] = useState('map');
  const [city, setCity] = useState('Chennai');
  const [area, setArea] = useState('All areas');
  const [query, setQuery] = useState('');
  const [focus, setFocus] = useState(false);
  const [cityMenu, setCityMenu] = useState(false);
  const [areaMenu, setAreaMenu] = useState(false);
  const [sort, setSort] = useState('new');
  const [priceFilter, setPriceFilter] = useState('all');
  const [kindFilter, setKindFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState('browse');
  const [pin, setPin] = useState(null);
  const [form, setFormState] = useState(emptyForm);
  const [saved, setSavedState] = useState(() => {
    try {
      const raw = localStorage.getItem('ploty_saved');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const setSaved = useCallback((updater) => {
    setSavedState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try { localStorage.setItem('ploty_saved', JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);
  const [toast, setToast] = useState('');
  const toastTimer = useRef(null);
  const [auth, setAuthState] = useState(() => {
    try {
      const raw = localStorage.getItem('plotmap_auth');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [authPrompt, setAuthPrompt] = useState(null);

  const flash = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2600);
  }, []);

  const setForm = useCallback((k, v) => {
    setFormState((f) => ({ ...f, [k]: v }));
  }, []);

  const isLive = (p) => p.kind !== 'layout' || !p.status || p.status === 'approved';

  const visible = useMemo(() => {
    let list = plots.filter((p) => isLive(p) && p.city === city);
    if (kindFilter !== 'all') list = list.filter((p) => p.kind === kindFilter);
    if (area !== 'All areas') list = list.filter((p) => p.area === area);
    if (priceFilter !== 'all') {
      const b = { value: [0, 1500], mid: [1500, 3000], premium: [3000, Infinity] }[priceFilter];
      list = list.filter((p) => p.ppsf >= b[0] && p.ppsf < b[1]);
    }
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((p) => (p.locality + ' ' + p.area + ' ' + p.landmark + ' ' + p.owner).toLowerCase().includes(q));
    if (sort === 'low') list = [...list].sort((a, b) => a.ppsf - b.ppsf);
    else if (sort === 'high') list = [...list].sort((a, b) => b.ppsf - a.ppsf);
    else list = [...list].sort((a, b) => a.days - b.days);
    return list;
  }, [plots, city, kindFilter, area, priceFilter, query, sort]);

  const sel = useMemo(() => plots.find((p) => p.id === selected) || null, [plots, selected]);

  const placing = mode === 'placing';
  const choosingKind = mode === 'kind';
  const formOpen = mode === 'form';
  const detailOpen = !!sel && !placing && !choosingKind && !formOpen;

  const open = useCallback((id, flyTo) => {
    setSelected(id);
    setTab('map');
    setFocus(false);
    setCityMenu(false);
    setAreaMenu(false);
    if (flyTo) {
      const p = plots.find((x) => x.id === id);
      if (p) flyTo(p);
    }
  }, [plots]);

  const goCity = useCallback((name, flyTo) => {
    setCity(name);
    setArea('All areas');
    setCityMenu(false);
    setSelected(null);
    if (flyTo) flyTo(CITIES[name]);
  }, []);

  const goArea = useCallback((name, flyToArea) => {
    setArea(name);
    setAreaMenu(false);
    setSelected(null);
    if (flyToArea) flyToArea(name);
  }, []);

  const doStartAdd = useCallback(() => {
    setMode('placing');
    setTab('map');
    setSelected(null);
    setPin(null);
    setFormState(emptyForm);
    setFocus(false);
    setCityMenu(false);
    setAreaMenu(false);
  }, []);

  const cancelAdd = useCallback(() => {
    setMode('browse');
    setPin(null);
    setTab('map');
  }, []);

  const backToPlacing = useCallback(() => setMode('placing'), []);
  const backToKind = useCallback(() => setMode('kind'), []);

  const confirmLocation = useCallback(() => {
    if (pin) setMode('kind');
    else flash('Tap anywhere on the map first');
  }, [pin, flash]);

  const chooseKind = useCallback((kind) => {
    setForm('kind', kind);
    setMode('form');
  }, [setForm]);

  const nearbyDuplicates = useMemo(() => {
    if (mode !== 'placing' || !pin) return [];
    return plots
      .map((p) => ({ p, d: distanceMeters(pin[0], pin[1], p.lat, p.lng) }))
      .filter((x) => x.d <= NEARBY_THRESHOLD_M)
      .sort((a, b) => a.d - b.d)
      .map((x) => ({ ...x.p, distance: Math.round(x.d) }));
  }, [plots, pin, mode]);

  const size = num(form.size);
  const price = num(form.price);
  const derivedPpsf = form.priceMode === 'ppsf' ? price : (size ? price / size : 0);
  const derivedTotal = form.priceMode === 'ppsf' ? price * size : price;
  const fb = band(derivedPpsf || 0);
  const canPublish = !!pin && !!form.locality.trim() && (form.kind === 'layout'
    ? num(form.plots) > 0 && num(form.ppsfMin) > 0 && num(form.sizeMin) > 0 && !!form.company.trim()
    : derivedPpsf > 0 && size > 0);

  const publish = useCallback(() => {
    if (!canPublish) {
      flash(form.kind === 'layout' ? 'Company name, plot count, sizes and price are required' : 'Locality, price and size are required');
      return;
    }
    const areaFor = area === 'All areas' ? CITIES[city].areas[1] : area;
    if (form.kind === 'layout') {
      const lo = num(form.ppsfMin), hi = Math.max(num(form.ppsfMax) || lo, lo);
      const smin = num(form.sizeMin), smax = Math.max(num(form.sizeMax) || smin, smin);
      const L2 = {
        id: 'u' + Date.now(), kind: 'layout', locality: form.locality.trim(), city, area: areaFor,
        lat: pin[0], lng: pin[1], plots: num(form.plots), sizeMin: smin, sizeMax: smax,
        ppsf: lo, ppsfMax: hi, notes: form.notes.trim() || 'No additional notes provided by the developer.',
        owner: form.company.trim(), days: 1, landmark: 'Pinned by you', approval: 'Not stated',
        contact: form.contact.trim() || 'Not shared', media: form.media.slice(), amenities: form.amenities.slice(),
        status: 'pending', submittedBy: (auth && auth.name) || 'You',
      };
      setPlots((prev) => [L2, ...prev]);
      setMode('browse'); setPin(null); setSelected(null); setTab('map');
      setArea('All areas'); setPriceFilter('all'); setKindFilter('all');
      setFormState(emptyForm);
      flash('Layout submitted for review — you’ll be notified once it’s approved');
      return;
    }
    const p = {
      id: 'u' + Date.now(), locality: form.locality.trim(), city, area: areaFor, kind: 'plot',
      lat: pin[0], lng: pin[1], sqft: size, ppsf: Math.round(derivedPpsf),
      notes: form.notes.trim() || 'No additional notes provided by the lister.', media: form.media.slice(), amenities: form.amenities.slice(),
      owner: (auth && auth.name) || 'You', days: 1, landmark: 'Pinned by you', contact: form.contact.trim() || 'Not shared',
    };
    setPlots((prev) => [p, ...prev]);
    setMode('browse'); setPin(null); setSelected(p.id); setTab('map');
    setArea('All areas'); setPriceFilter('all'); setKindFilter('all');
    setFormState(emptyForm);
    flash('Plot published — live for everyone');
  }, [canPublish, form, area, city, pin, derivedPpsf, size, flash, auth]);

  const pendingLayouts = useMemo(
    () => plots.filter((p) => p.kind === 'layout' && p.status === 'pending'),
    [plots],
  );

  const approveLayout = useCallback((id) => {
    setPlots((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'approved' } : p)));
    flash('Layout approved — now live for everyone');
  }, [flash]);

  const rejectLayout = useCallback((id) => {
    setPlots((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'rejected' } : p)));
    flash('Layout rejected');
  }, [flash]);

  const openAuthPrompt = useCallback((reason) => setAuthPrompt({ reason }), []);
  const cancelAuthPrompt = useCallback(() => setAuthPrompt(null), []);

  const startAdd = useCallback(() => {
    if (!auth) { openAuthPrompt('register'); return; }
    doStartAdd();
  }, [auth, doStartAdd, openAuthPrompt]);

  const toggleSave = useCallback(() => {
    if (!sel) return;
    const on = saved.includes(sel.id);
    setSaved((s) => (on ? s.filter((x) => x !== sel.id) : s.concat(sel.id)));
    flash(on ? 'Removed from saved' : 'Saved to your shortlist');
  }, [sel, saved, flash, setSaved]);

  const doContact = useCallback(() => {
    if (!sel) return;
    flash(sel.contact === 'Not shared' ? 'This lister did not share contact details' : 'Calling ' + sel.contact);
  }, [sel, flash]);

  const contact = useCallback(() => {
    if (!sel) return;
    if (!auth) { openAuthPrompt('call'); return; }
    doContact();
  }, [sel, auth, doContact, openAuthPrompt]);

  const login = useCallback((name, phone) => {
    const u = { name: name.trim(), phone: phone.trim() };
    setAuthState(u);
    try { localStorage.setItem('plotmap_auth', JSON.stringify(u)); } catch { /* ignore */ }
    setAuthPrompt((current) => {
      if (current?.reason === 'call') doContact();
      else if (current?.reason === 'register') doStartAdd();
      return null;
    });
  }, [doContact, doStartAdd]);

  const logout = useCallback(() => {
    setAuthState(null);
    try { localStorage.removeItem('plotmap_auth'); } catch { /* ignore */ }
  }, []);

  const closeDetail = useCallback(() => setSelected(null), []);

  const onFiles = useCallback((files) => {
    const add = files.slice(0, Math.max(0, 8 - form.media.length)).map((file, k) => ({
      url: URL.createObjectURL(file),
      bg: shot(form.media.length + k),
      type: file.type.indexOf('video') === 0 ? 'video' : 'photo',
    }));
    if (!add.length) { flash('Up to 8 files per plot'); return; }
    setForm('media', form.media.concat(add));
  }, [form.media, flash, setForm]);

  return {
    plots, visible, sel, tab, city, area, query, focus, cityMenu, areaMenu, sort, priceFilter, kindFilter,
    mode, pin, form, saved, toast, placing, choosingKind, formOpen, detailOpen,
    derivedPpsf, derivedTotal, fb, canPublish, nearbyDuplicates, pendingLayouts,
    auth, authPrompt, openAuthPrompt, cancelAuthPrompt, login, logout,
    setTab, setQuery, setFocus, setCityMenu, setAreaMenu, setSort, setPriceFilter, setKindFilter,
    setForm, setPin,
    open, goCity, goArea, startAdd, cancelAdd, backToPlacing, backToKind, chooseKind, confirmLocation, publish,
    approveLayout, rejectLayout,
    toggleSave, contact, closeDetail, onFiles, flash,
  };
}
