import { band, inr, kShort, ppsfLabel, sqftRange } from './utils';

// Derives the two legal-approval badges from real backend fields
// (planning_approval, rera_status — mandatory at submission, see
// AddForm.jsx and validateApproval in the Edge Functions) for both plots
// and layouts alike. Always shows a definite state either way — approved
// or not, registered/exempted or not — never a fabricated claim.
export function approvalBadges(p) {
  const planning = {
    dtcp: { label: 'DTCP Approved', color: '#146b41', bg: '#e5f5ec', border: '#bfe3cf' },
    cmda: { label: 'CMDA Approved', color: '#146b41', bg: '#e5f5ec', border: '#bfe3cf' },
    none: { label: 'No DTCP or CMDA Approval', color: '#b8790f', bg: '#fdf1de', border: '#f0d9a8' },
  }[p.planningApproval] || { label: 'Approval not stated', color: '#6b7570', bg: '#f6f9f7', border: '#e5e9e6' };

  const rera = {
    registered: { label: 'RERA Registered', color: '#146b41', bg: '#e5f5ec', border: '#bfe3cf' },
    exempted: { label: 'RERA Exempted', color: '#5c3a97', bg: '#f1ecfa', border: '#d9caf0' },
    not_registered: { label: 'RERA Not Registered', color: '#b8790f', bg: '#fdf1de', border: '#f0d9a8' },
  }[p.reraStatus] || { label: 'RERA status not stated', color: '#6b7570', bg: '#f6f9f7', border: '#e5e9e6' };

  return { planning, rera };
}

// "Listed" reflects created_at; once a listing has actually been edited
// (wasEdited, computed in usePlotMap.js from updated_at vs created_at),
// "Updated" from updated_at is more relevant — a 2-year-old listing edited
// this morning should read "Updated today," not "Listed 730 days ago."
function ageLabel(p, capitalized) {
  const verb = capitalized ? (p.wasEdited ? 'Updated' : 'Listed') : (p.wasEdited ? 'updated' : 'listed');
  const d = p.wasEdited ? p.updatedDays : p.days;
  if (d === 0) return verb + ' today';
  if (d === 1) return verb + ' yesterday';
  return verb + ' ' + d + ' days ago';
}

export function listCardFields(p) {
  const isLayout = p.kind === 'layout';
  // p.landmarks is already ranked by importance (category weight + distance)
  // server-side, not just nearest-first — see sync_listing_landmarks in
  // supabase/sql/landmarks.sql — so rank 1 is the right "headline" pick.
  const nearest = (p.landmarks || [])[0] || null;
  return {
    id: p.id,
    locality: p.locality,
    cityLine: p.area.toUpperCase() + ', ' + p.city.toUpperCase(),
    color: band(p.ppsf).color,
    ppsfPrefix: isLayout ? 'From' : null,
    ppsfLabel: ppsfLabel(p.ppsf),
    isLayout,
    thumbBg: p.media.length ? (p.media[0].url ? 'url("' + p.media[0].url + '") center/cover' + (p.media[0].bg ? ', ' + p.media[0].bg : '') : p.media[0].bg) : null,
    mediaBadge: p.media.length ? String(p.media.length) : null,
    amenitiesCount: p.amenities.length,
    plotSizeLabel: (isLayout ? sqftRange(p.sizeMin, p.sizeMax) : Math.round(p.sqft).toLocaleString('en-IN')) + ' sqft',
    totalPricePrefix: isLayout ? 'From' : null,
    totalPriceLabel: isLayout ? inr(p.sizeMin * p.ppsf) : inr(p.sqft * p.ppsf),
    plotsCountLabel: isLayout ? String(p.plots) : '1',
    age: ageLabel(p, true),
    distanceLabel: nearest ? nearest.distanceKm + ' km' : '—',
    distanceLandmark: nearest ? nearest.name : 'No data yet',
    approval: approvalBadges(p),
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
    approval: approvalBadges(sel),
    trustText: isLayout
      ? 'Developer Listed · prices are indicative ranges published by the developer, not verified by Ploty.'
      : 'Community Listed · unverified. Details are submitted by a member, not checked by Ploty.',
    trustColor: isLayout ? '#146b41' : '#5c3a97',
    trustBg: isLayout ? '#e5f5ec' : '#f1ecfa',
    trustBorder: isLayout ? '#a8dcbf' : '#d9caf0',
    trustMark: isLayout ? '#1f9d64' : '#8355c9',
    ownerLabel: isLayout ? 'DEVELOPER' : 'LISTED BY',
    bandBg: b.bg,
    bandLabel: isLayout ? 'LAYOUT' : b.label,
    locality: sel.locality, cityLine: sel.area.toUpperCase() + ' · ' + sel.city.toUpperCase(),
    size: Math.round(sel.sqft || 0).toLocaleString('en-IN') + ' sqft',
    total: inr((sel.sqft || 0) * sel.ppsf),
    media: sel.media.map((m, i) => ({
      bg: m.url ? 'url("' + m.url + '") center/cover' + (m.bg ? ', ' + m.bg : '') : m.bg,
      isVideo: m.type === 'video',
      label: m.type === 'video' ? 'VIDEO' : 'PHOTO ' + (i + 1),
    })),
    noMedia: sel.media.length === 0,
    mediaCount: sel.media.length ? photoCount + ' photo' + (photoCount === 1 ? '' : 's') + (hasVideo ? ' + video' : '') : 'None',
    notes: sel.notes, owner: sel.owner, amenities: sel.amenities || [], landmarks: sel.landmarks || [],
    age: ageLabel(sel, false),
    coords: sel.lat.toFixed(5) + '° N, ' + sel.lng.toFixed(5) + '° E',
    landmark: sel.landmark,
    contactLabel: sel.contact === 'Not shared' ? 'No contact shared'
      : isLayout ? 'Contact sales team' : 'Contact ' + sel.owner.split(' ')[0],
  };
}
