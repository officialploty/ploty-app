import { band, inr, kShort, ppsfLabel, sqftRange } from './utils';

export function listCardFields(p) {
  return {
    locality: p.locality,
    color: band(p.ppsf).color,
    ppsfLabel: p.kind === 'layout' ? kShort(p.ppsf) + '–' + kShort(p.ppsfMax) : ppsfLabel(p.ppsf),
    metaLine: p.kind === 'layout'
      ? p.area.toUpperCase() + ' · LAYOUT · ' + p.plots + ' PLOTS'
      : p.area.toUpperCase() + ' · ' + p.media.length + (p.media.length === 1 ? ' FILE' : ' FILES'),
    thumbBg: p.media.length ? (p.media[0].url ? 'url("' + p.media[0].url + '") center/cover, ' + p.media[0].bg : p.media[0].bg) : 'rgba(255,255,255,.05)',
    mediaBadge: p.media.length ? String(p.media.length) : '0',
    notesShort: p.notes.length > 110 ? p.notes.slice(0, 110) + '…' : p.notes,
    sizeLabel: (p.kind === 'layout' ? sqftRange(p.sizeMin, p.sizeMax) : Math.round(p.sqft).toLocaleString('en-IN')) + ' SQFT',
    totalLabel: p.kind === 'layout' ? p.owner : inr(p.sqft * p.ppsf),
    age: p.days === 1 ? 'yesterday' : p.days + 'd ago',
  };
}

export function detailFields(sel) {
  if (!sel) return null;
  const isLayout = sel.kind === 'layout';
  const b = band(sel.ppsf);
  const photoCount = sel.media.filter((m) => m.type === 'photo').length;
  const hasVideo = sel.media.some((m) => m.type === 'video');
  return {
    isLayout, isPlot: !isLayout,
    ppsf: ppsfLabel(sel.ppsf), color: b.color,
    range: isLayout ? kShort(sel.ppsf) + ' – ' + kShort(sel.ppsfMax) : '',
    plotCount: isLayout ? sel.plots + ' plots' : '',
    sizeRange: isLayout ? sqftRange(sel.sizeMin, sel.sizeMax) + ' sqft' : '',
    approval: isLayout ? (sel.approval || 'Not stated') : '',
    trustText: isLayout
      ? 'Developer Listed · prices are indicative ranges published by the developer, not verified by Ploty.'
      : 'Community Listed · unverified. Details are submitted by a member, not checked by Ploty.',
    trustColor: isLayout ? '#8ef0dd' : '#c3bbff',
    trustBg: isLayout ? 'rgba(53,224,192,.1)' : 'rgba(139,123,255,.1)',
    trustBorder: isLayout ? 'rgba(53,224,192,.26)' : 'rgba(139,123,255,.26)',
    trustMark: isLayout ? '#35e0c0' : '#8b7bff',
    ownerLabel: isLayout ? 'DEVELOPER' : 'LISTED BY',
    bandBg: b.bg,
    bandLabel: isLayout ? 'LAYOUT' : b.label,
    locality: sel.locality, cityLine: sel.area.toUpperCase() + ' · ' + sel.city.toUpperCase(),
    size: Math.round(sel.sqft || 0).toLocaleString('en-IN') + ' sqft',
    total: inr((sel.sqft || 0) * sel.ppsf),
    media: sel.media.map((m, i) => ({
      bg: m.url ? 'url("' + m.url + '") center/cover, ' + m.bg : m.bg,
      isVideo: m.type === 'video',
      label: m.type === 'video' ? 'VIDEO' : 'PHOTO ' + (i + 1),
    })),
    noMedia: sel.media.length === 0,
    mediaCount: sel.media.length ? photoCount + ' photo' + (photoCount === 1 ? '' : 's') + (hasVideo ? ' + video' : '') : 'None',
    notes: sel.notes, owner: sel.owner, amenities: sel.amenities || [],
    age: sel.days === 1 ? 'listed yesterday' : 'listed ' + sel.days + ' days ago',
    coords: sel.lat.toFixed(5) + '° N, ' + sel.lng.toFixed(5) + '° E',
    landmark: sel.landmark,
    contactLabel: sel.contact === 'Not shared' ? 'No contact shared'
      : isLayout ? 'Contact sales team' : 'Contact ' + sel.owner.split(' ')[0],
  };
}
