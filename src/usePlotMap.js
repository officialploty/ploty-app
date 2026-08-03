import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CITIES } from './data';
import { band, distanceMeters, NEARBY_THRESHOLD_M, num, shot } from './utils';
import { supabase } from './supabaseClient';

const PENDING_AUTH_REASON_KEY = 'ploty_pending_auth_reason';

function toAuthShape(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'You',
    email: user.email,
    avatarUrl: user.user_metadata?.avatar_url || null,
  };
}

function daysSince(iso) {
  if (!iso) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
}

// Maps a real `plots`/`layouts` row from Supabase into the shape the UI
// already expects (unchanged from the prototype's mock data shape).
// `media` is attached separately by the caller (loadListings/publish) since
// it needs its own fetch — no FK-based auto-join is possible here (media
// uses a polymorphic owner_type+owner_id, not a real foreign key).
// `amenities` is still left empty — same limitation, not yet wired.
function mapDbPlot(row) {
  return {
    id: row.id, kind: 'plot', locality: row.locality, city: row.city, area: row.area,
    lat: row.lat, lng: row.lng, sqft: row.sqft, ppsf: row.ppsf,
    notes: row.notes || 'No additional notes provided by the lister.',
    owner: row.owner || 'Unknown', landmark: row.landmark || 'Pinned by lister',
    contact: row.contact || 'Not shared', days: daysSince(row.created_at),
    amenities: [], media: [], submittedBy: row.submitted_by, updatedAt: row.updated_at,
  };
}

function mapDbLayout(row) {
  return {
    id: row.id, kind: 'layout', locality: row.locality, city: row.city, area: row.area,
    lat: row.lat, lng: row.lng, plots: row.plot_count, sizeMin: row.size_min, sizeMax: row.size_max,
    ppsf: row.ppsf_min, ppsfMax: row.ppsf_max,
    notes: row.notes || 'No additional notes provided by the developer.',
    owner: row.owner || 'Developer', landmark: row.landmark || 'Pinned by developer',
    approval: row.approval_number || 'Not stated', contact: row.contact || 'Not shared',
    days: daysSince(row.created_at), amenities: [], media: [],
    status: row.status, submittedBy: row.submitted_by, updatedAt: row.updated_at,
  };
}

const EDGE_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

async function callEdgeFunction(name, body) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('not signed in');
  const res = await fetch(`${EDGE_BASE}/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'request failed');
  return json;
}

const MEDIA_BUCKET = 'listing-media';

// Uploads each file in `mediaItems` to Storage under the signed-in user's own
// folder, then attaches it to the given plot/layout via the `media` table.
// RLS on `media` requires the row to already exist and be owned by the
// caller, so this must run after the plot/layout has been created.
async function uploadMedia(ownerType, ownerId, mediaItems, userId, startIndex = 0) {
  const results = [];
  for (let i = 0; i < mediaItems.length; i += 1) {
    const item = mediaItems[i];
    if (!item.file) continue;
    const position = startIndex + i;
    const ext = item.file.name.split('.').pop() || (item.type === 'video' ? 'mp4' : 'jpg');
    const path = `${userId}/${ownerType}/${ownerId}/${position}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from(MEDIA_BUCKET).upload(path, item.file, { upsert: true });
    if (uploadErr) { console.error('media upload failed:', uploadErr.message); continue; }
    const { error: rowErr } = await supabase.from('media').insert({
      owner_type: ownerType, owner_id: ownerId, storage_path: path, type: item.type, position,
    });
    if (rowErr) { console.error('media row insert failed:', rowErr.message); continue; }
    const { data: { publicUrl } } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
    results.push({ url: publicUrl, type: item.type });
  }
  return results;
}

const emptyForm = {
  kind: 'plot', locality: '', area: '', priceMode: 'ppsf', price: '', size: '', notes: '', contact: '', media: [], amenities: [],
  plots: '', sizeMin: '', sizeMax: '', ppsfMin: '', ppsfMax: '', company: '',
};

export function usePlotMap() {
  const [plots, setPlots] = useState([]);
  const [plotsLoading, setPlotsLoading] = useState(true);
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
  const [auth, setAuthState] = useState(null);
  const [authPrompt, setAuthPrompt] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const flash = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2600);
  }, []);

  const setForm = useCallback((k, v) => {
    setFormState((f) => ({ ...f, [k]: v }));
  }, []);

  // Real data from Supabase, replacing the prototype's mock seed. RLS does
  // the filtering for us — a non-staff fetch of `layouts` only ever returns
  // status='approved' rows, so pending layouts naturally stay invisible
  // here without any extra client-side logic.
  const loadListings = useCallback(async () => {
    setPlotsLoading(true);
    const [
      { data: plotRows, error: plotErr },
      { data: layoutRows, error: layoutErr },
      { data: mediaRows, error: mediaErr },
      { data: amenityRows, error: amenityErr },
    ] = await Promise.all([
      supabase.from('plots').select('*'),
      supabase.from('layouts').select('*'),
      supabase.from('media').select('*').order('position', { ascending: true }),
      supabase.from('listing_amenities').select('owner_type, owner_id, amenities(name)'),
    ]);
    if (plotErr) console.error('failed to load plots:', plotErr.message);
    if (layoutErr) console.error('failed to load layouts:', layoutErr.message);
    if (mediaErr) console.error('failed to load media:', mediaErr.message);
    if (amenityErr) console.error('failed to load amenities:', amenityErr.message);

    const mediaByOwner = new Map();
    for (const row of mediaRows || []) {
      const key = row.owner_type + ':' + row.owner_id;
      const { data: { publicUrl } } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(row.storage_path);
      const list = mediaByOwner.get(key) || [];
      list.push({ url: publicUrl, type: row.type });
      mediaByOwner.set(key, list);
    }

    const amenitiesByOwner = new Map();
    for (const row of amenityRows || []) {
      const key = row.owner_type + ':' + row.owner_id;
      const list = amenitiesByOwner.get(key) || [];
      if (row.amenities?.name) list.push(row.amenities.name);
      amenitiesByOwner.set(key, list);
    }

    const plots_ = (plotRows || []).map((r) => ({
      ...mapDbPlot(r), media: mediaByOwner.get('plot:' + r.id) || [], amenities: amenitiesByOwner.get('plot:' + r.id) || [],
    }));
    const layouts_ = (layoutRows || []).map((r) => ({
      ...mapDbLayout(r), media: mediaByOwner.get('layout:' + r.id) || [], amenities: amenitiesByOwner.get('layout:' + r.id) || [],
    }));
    setPlots([...plots_, ...layouts_]);
    setPlotsLoading(false);
  }, []);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

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
    setEditingId(null);
    setFocus(false);
    setCityMenu(false);
    setAreaMenu(false);
  }, []);

  const cancelAdd = useCallback(() => {
    setMode('browse');
    setPin(null);
    setEditingId(null);
    setTab('map');
  }, []);

  // Jumps straight to the details step (step 3), pre-filled from an
  // existing listing the signed-in user owns — skips the placing/kind
  // steps since the pin and kind are already known.
  const startEdit = useCallback((listing) => {
    setSelected(null);
    setPin([listing.lat, listing.lng]);
    setEditingId(listing.id);
    setFormState({
      ...emptyForm,
      kind: listing.kind,
      locality: listing.locality,
      area: listing.area,
      priceMode: 'ppsf',
      price: listing.kind === 'layout' ? String(listing.ppsf) : String(listing.ppsf),
      size: listing.kind === 'layout' ? '' : String(listing.sqft),
      notes: listing.notes || '',
      contact: listing.contact === 'Not shared' ? '' : listing.contact,
      amenities: listing.amenities.slice(),
      plots: listing.kind === 'layout' ? String(listing.plots) : '',
      sizeMin: listing.kind === 'layout' ? String(listing.sizeMin) : '',
      sizeMax: listing.kind === 'layout' ? String(listing.sizeMax) : '',
      ppsfMin: listing.kind === 'layout' ? String(listing.ppsf) : '',
      ppsfMax: listing.kind === 'layout' ? String(listing.ppsfMax) : '',
      company: listing.kind === 'layout' ? listing.owner : '',
    });
    setMode('form');
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
  const canPublish = !!pin && !!form.locality.trim() && !!form.area && (form.kind === 'layout'
    ? num(form.plots) > 0 && num(form.ppsfMin) > 0 && num(form.sizeMin) > 0 && !!form.company.trim()
    : derivedPpsf > 0 && size > 0);

  const publish = useCallback(async () => {
    if (!canPublish) {
      flash(form.kind === 'layout' ? 'Company name, plot count, sizes and price are required' : 'Locality, price and size are required');
      return;
    }
    if (publishing) return;
    setPublishing(true);
    const areaFor = form.area;
    const editId = editingId;
    if (form.kind === 'layout') {
      const lo = num(form.ppsfMin), hi = Math.max(num(form.ppsfMax) || lo, lo);
      const smin = num(form.sizeMin), smax = Math.max(num(form.sizeMax) || smin, smin);
      const payload = {
        locality: form.locality.trim(), city, area: areaFor,
        lat: pin[0], lng: pin[1], landmark: 'Pinned by you',
        plot_count: num(form.plots), size_min: smin, size_max: smax,
        ppsf_min: lo, ppsf_max: hi,
        notes: form.notes.trim() || undefined,
        owner: form.company.trim(),
        contact: form.contact.trim() || undefined,
        amenities: form.amenities.slice(),
      };
      try {
        if (editId) {
          const { layout, sent_back_to_review } = await callEdgeFunction('update-layout', { id: editId, ...payload });
          const media = form.media.length ? await uploadMedia('layout', editId, form.media, auth?.id, plots.find((p) => p.id === editId)?.media.length || 0) : [];
          setPlots((prev) => prev.map((p) => (p.id === editId ? { ...mapDbLayout(layout), amenities: form.amenities.slice(), media: [...p.media, ...media] } : p)));
          setEditingId(null);
          setMode('browse'); setPin(null); setSelected(editId); setTab('map');
          setArea('All areas'); setPriceFilter('all'); setKindFilter('all');
          setFormState(emptyForm);
          flash(sent_back_to_review ? 'Changes saved — sent back for re-review since it was already approved' : 'Changes saved');
        } else {
          const { layout } = await callEdgeFunction('submit-layout', payload);
          const media = form.media.length ? await uploadMedia('layout', layout.id, form.media, auth?.id) : [];
          setPlots((prev) => [{ ...mapDbLayout(layout), amenities: form.amenities.slice(), media }, ...prev]);
          setMode('browse'); setPin(null); setSelected(null); setTab('map');
          setArea('All areas'); setPriceFilter('all'); setKindFilter('all');
          setFormState(emptyForm);
          flash('Layout submitted for review — you’ll be notified once it’s approved');
        }
      } catch (err) {
        flash(editId ? 'Could not save changes: ' + err.message : 'Could not submit layout: ' + err.message);
      } finally {
        setPublishing(false);
      }
      return;
    }
    const payload = {
      locality: form.locality.trim(), city, area: areaFor,
      lat: pin[0], lng: pin[1], landmark: 'Pinned by you',
      sqft: size, ppsf: Math.round(derivedPpsf),
      notes: form.notes.trim() || undefined,
      owner: auth?.name,
      contact: form.contact.trim() || undefined,
      amenities: form.amenities.slice(),
    };
    try {
      if (editId) {
        const { plot } = await callEdgeFunction('update-plot', { id: editId, ...payload });
        const media = form.media.length ? await uploadMedia('plot', editId, form.media, auth?.id, plots.find((p) => p.id === editId)?.media.length || 0) : [];
        setPlots((prev) => prev.map((p) => (p.id === editId ? { ...mapDbPlot(plot), amenities: form.amenities.slice(), media: [...p.media, ...media] } : p)));
        setEditingId(null);
        setMode('browse'); setPin(null); setSelected(editId); setTab('map');
        setArea('All areas'); setPriceFilter('all'); setKindFilter('all');
        setFormState(emptyForm);
        flash('Changes saved');
      } else {
        const { plot, nearby_warning } = await callEdgeFunction('submit-plot', payload);
        const media = form.media.length ? await uploadMedia('plot', plot.id, form.media, auth?.id) : [];
        setPlots((prev) => [{ ...mapDbPlot(plot), amenities: form.amenities.slice(), media }, ...prev]);
        setMode('browse'); setPin(null); setSelected(plot.id); setTab('map');
        setArea('All areas'); setPriceFilter('all'); setKindFilter('all');
        setFormState(emptyForm);
        flash(nearby_warning?.length ? 'Plot published — heads up, a similar pin exists nearby' : 'Plot published — live for everyone');
      }
    } catch (err) {
      flash(editId ? 'Could not save changes: ' + err.message : 'Could not publish plot: ' + err.message);
    } finally {
      setPublishing(false);
    }
  }, [canPublish, publishing, form, area, city, pin, derivedPpsf, size, flash, auth, editingId, plots]);

  const pendingLayouts = useMemo(
    () => plots.filter((p) => p.kind === 'layout' && p.status === 'pending'),
    [plots],
  );

  const myListings = useMemo(
    () => (auth ? plots.filter((p) => p.submittedBy === auth.id) : []),
    [plots, auth],
  );

  const addMediaToListing = useCallback(async (listing, files) => {
    if (!auth || !files.length) return;
    const items = files.slice(0, Math.max(0, 8 - listing.media.length)).map((file) => ({
      file, type: file.type.indexOf('video') === 0 ? 'video' : 'photo',
    }));
    if (!items.length) { flash('Up to 8 files per listing'); return; }
    const uploaded = await uploadMedia(listing.kind, listing.id, items, auth.id, listing.media.length);
    if (!uploaded.length) { flash('Could not upload photos'); return; }
    setPlots((prev) => prev.map((p) => (p.id === listing.id ? { ...p, media: [...p.media, ...uploaded] } : p)));
    flash(uploaded.length + (uploaded.length === 1 ? ' photo added' : ' photos added'));
  }, [auth, flash]);

  const approveLayout = useCallback(async (id) => {
    try {
      await callEdgeFunction('approve-layout', { layout_id: id });
      setPlots((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'approved' } : p)));
      flash('Layout approved — now live for everyone');
    } catch (err) {
      flash('Could not approve layout: ' + err.message);
    }
  }, [flash]);

  const rejectLayout = useCallback(async (id) => {
    try {
      await callEdgeFunction('reject-layout', { layout_id: id });
      setPlots((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'rejected' } : p)));
      flash('Layout rejected');
    } catch (err) {
      flash('Could not reject layout: ' + err.message);
    }
  }, [flash]);

  const openAuthPrompt = useCallback((reason) => setAuthPrompt({ reason }), []);
  const cancelAuthPrompt = useCallback(() => setAuthPrompt(null), []);

  // Google sign-in is a full-page redirect, so any in-memory "resume this
  // action after login" state would be lost — persist the reason first,
  // then pick it back up once the session lands (see the effect below).
  const loginWithGoogle = useCallback(() => {
    const reason = authPrompt?.reason;
    if (reason) sessionStorage.setItem(PENDING_AUTH_REASON_KEY, reason);
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  }, [authPrompt]);

  const logout = useCallback(() => {
    supabase.auth.signOut();
  }, []);

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

  // Tracks the real Supabase session — populated on mount and kept in sync
  // as sign-in/sign-out happen (including the redirect back from Google).
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState(toAuthShape(session?.user ?? null));
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setAuthState(toAuthShape(user));

      if (user) {
        const reason = sessionStorage.getItem(PENDING_AUTH_REASON_KEY);
        if (reason) {
          sessionStorage.removeItem(PENDING_AUTH_REASON_KEY);
          setAuthPrompt(null);
          if (reason === 'call') doContact();
          else if (reason === 'register') doStartAdd();
        }
      }
    });

    return () => subscription.subscription.unsubscribe();
  }, [doContact, doStartAdd]);

  const closeDetail = useCallback(() => setSelected(null), []);

  const onFiles = useCallback((files) => {
    const add = files.slice(0, Math.max(0, 8 - form.media.length)).map((file, k) => ({
      file,
      url: URL.createObjectURL(file),
      bg: shot(form.media.length + k),
      type: file.type.indexOf('video') === 0 ? 'video' : 'photo',
    }));
    if (!add.length) { flash('Up to 8 files per plot'); return; }
    setForm('media', form.media.concat(add));
  }, [form.media, flash, setForm]);

  return {
    plots, plotsLoading, visible, sel, tab, city, area, query, focus, cityMenu, areaMenu, sort, priceFilter, kindFilter,
    mode, pin, form, saved, toast, placing, choosingKind, formOpen, detailOpen,
    derivedPpsf, derivedTotal, fb, canPublish, publishing, nearbyDuplicates, pendingLayouts, myListings, addMediaToListing,
    editingId, startEdit,
    auth, authPrompt, openAuthPrompt, cancelAuthPrompt, loginWithGoogle, logout,
    setTab, setQuery, setFocus, setCityMenu, setAreaMenu, setSort, setPriceFilter, setKindFilter,
    setForm, setPin,
    open, goCity, goArea, startAdd, cancelAdd, backToPlacing, backToKind, chooseKind, confirmLocation, publish,
    approveLayout, rejectLayout,
    toggleSave, contact, closeDetail, onFiles, flash,
  };
}
