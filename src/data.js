import { shot } from './utils';

export const AMENITIES = [
  'Water connection', 'EB connection', 'Drainage', 'Tar road',
  'Compound wall', 'Corner plot', 'Gated layout', 'Park nearby',
  'Streetlights', 'Sewage line',
];

export const CITIES = {
  Chennai: { center: [13.02, 80.19], zoom: 11, areas: ['All areas', 'Adyar', 'Anna Nagar', 'OMR', 'GST Road', 'West Chennai'] },
  Bengaluru: { center: [12.95, 77.68], zoom: 10.5, areas: ['All areas', 'Whitefield', 'Sarjapur', 'North', 'South'] },
  Mumbai: { center: [19.05, 73.05], zoom: 10, areas: ['All areas', 'Navi Mumbai', 'Outer'] },
  Delhi: { center: [28.48, 77.05], zoom: 10, areas: ['All areas', 'NCR South', 'NCR West'] },
};

const SEED = [
  ['Adyar, Kasturba Nagar', 'Chennai', 'Adyar', 13.0064, 80.2565, 2400, 8500, 'DTCP approved, 30ft tar road, walkable to Adyar bus depot. Clear parent documents, single owner since 1998.', 'Meera R.', 3, 'Adyar Signal 900m'],
  ['Besant Nagar, 2nd Ave', 'Chennai', 'Adyar', 13.0002, 80.2668, 1800, 9800, 'Corner plot near Elliots Beach. CMDA approved layout, compound wall done.', 'Karthik S.', 8, 'Elliots Beach 1.2km'],
  ['Thiruvanmiyur, LB Road', 'Chennai', 'Adyar', 12.983, 80.2594, 1600, 7600, 'Residential zone, metro station under 1km. Patta available.', 'Sundar V.', 14, 'Thiruvanmiyur Metro'],
  ['Perungudi, OMR', 'Chennai', 'OMR', 12.965, 80.245, 2000, 5200, 'Gated layout plot, 40ft internal road, IT corridor 5 min drive.', 'Aravind K.', 2, 'Perungudi Toll 1.5km'],
  ['Sholinganallur, Nookampalayam', 'Chennai', 'OMR', 12.901, 80.2279, 2400, 4200, 'New DTCP layout phase 2. Water and EB connection ready.', 'Divya N.', 5, 'Sholinganallur Junction'],
  ['Navalur, Egattur', 'Chennai', 'OMR', 12.844, 80.227, 3000, 3100, 'Approved layout, near IT parks. Ideal for villa construction.', 'Rahul T.', 11, 'Navalur Signal'],
  ['Kelambakkam, Thalambur Rd', 'Chennai', 'OMR', 12.79, 80.221, 4800, 1450, 'Large plot, panchayat approval, negotiable in 2 splits.', 'Naveen P.', 1, 'Kelambakkam Bus Stand'],
  ['Anna Nagar West Extn', 'Chennai', 'Anna Nagar', 13.085, 80.2101, 1200, 11000, 'Prime residential, close to metro. Ready for immediate registration.', 'Lakshmi G.', 6, 'Anna Nagar Tower Park'],
  ['Kilpauk Garden Road', 'Chennai', 'Anna Nagar', 13.085, 80.234, 1450, 9500, 'Old bungalow plot, demolition done, clear title.', 'Ramesh A.', 21, 'Kilpauk Medical College'],
  ['Ambattur, Industrial Estate', 'Chennai', 'West Chennai', 13.1143, 80.1548, 2600, 3900, 'Mixed-use zone plot, good for warehouse or residential.', 'Suresh M.', 9, 'Ambattur Estate'],
  ['Avadi, Paruthipattu', 'Chennai', 'West Chennai', 13.1147, 80.1098, 2200, 2100, 'DTCP layout, near Avadi railway station.', 'Vetri C.', 17, 'Avadi Station 2km'],
  ['Poonamallee Bypass', 'Chennai', 'West Chennai', 13.049, 80.095, 3200, 1800, 'Highway-facing plot, good appreciation potential.', 'Anitha J.', 4, 'Poonamallee Bypass'],
  ['Tambaram East', 'Chennai', 'GST Road', 12.925, 80.1, 1800, 4500, 'Residential plot in developed street, all amenities nearby.', 'Prakash D.', 12, 'Tambaram Station'],
  ['Chromepet, Radha Nagar', 'Chennai', 'GST Road', 12.9516, 80.1462, 1500, 5000, 'Approved plot, school and hospital within 500m.', 'Gayathri S.', 7, 'Chromepet GST Road'],
  ['Vandalur, Kolapakkam', 'Chennai', 'GST Road', 12.892, 80.081, 3600, 1200, 'Budget plot near zoo, panchayat approved, road formed.', 'Mohan R.', 19, 'Vandalur Zoo 2km'],
  ['Thiruporur, Kalavakkam', 'Chennai', 'OMR', 12.723, 80.193, 5400, 950, 'Agricultural-to-residential converted, bulk deal preferred.', 'Selvam K.', 26, 'SRM Kalavakkam'],
  ['Madhavaram Milk Colony', 'Chennai', 'West Chennai', 13.149, 80.23, 2000, 2600, 'Near upcoming metro depot, good rental demand.', 'Bhuvana L.', 15, 'Madhavaram Bus Terminus'],
  ['Porur, Kundrathur Rd', 'Chennai', 'West Chennai', 13.035, 80.158, 1900, 6200, 'Prime plot near Porur lake, CMDA approved.', 'Jagan V.', 10, 'Porur Junction'],
  ['Whitefield, Hoodi', 'Bengaluru', 'Whitefield', 12.9916, 77.7101, 2400, 6500, 'BMRDA approved, near ITPL. Khata A available.', 'Deepak N.', 5, 'Hoodi Circle'],
  ['Sarjapur, Dommasandra', 'Bengaluru', 'Sarjapur', 12.8892, 77.7305, 3000, 4200, 'Layout plot on Sarjapur main road, 30ft road.', 'Anjali M.', 9, 'Dommasandra Circle'],
  ['Devanahalli, Airport Rd', 'Bengaluru', 'North', 13.2437, 77.7127, 4800, 1900, 'Investment plot near airport corridor.', 'Girish B.', 13, 'KIAL 8km'],
  ['Kanakapura Road, Harohalli', 'Bengaluru', 'South', 12.7642, 77.4842, 5000, 1600, 'Big plot, approved layout, water table good.', 'Shruti K.', 22, 'Harohalli Industrial Area'],
  ['Panvel, Kalamboli', 'Mumbai', 'Navi Mumbai', 19.0225, 73.1002, 1800, 5500, 'CIDCO area plot, near upcoming airport.', 'Nikhil J.', 6, 'Kalamboli Circle'],
  ['Karjat, Kashele', 'Mumbai', 'Outer', 18.9107, 73.3234, 6000, 900, 'Weekend-home land parcel with hill view.', 'Ritesh P.', 18, 'Karjat Station 9km'],
  ['Sohna Road, Damdama', 'Delhi', 'NCR South', 28.2469, 77.0745, 3600, 2200, 'Farmhouse plot near Damdama lake, clear mutation.', 'Vikram S.', 16, 'Damdama Lake'],
  ['Bahadurgarh, Sector 9', 'Delhi', 'NCR West', 28.6923, 76.9354, 2000, 2600, 'HSVP-adjacent plot, metro-connected.', 'Pooja A.', 20, 'Bahadurgarh Metro'],
];

const LAYOUTS = [
  ['Thalambur Greenfields', 'Chennai', 'OMR', 12.8105, 80.2088, 240, 1200, 2400, 3100, 4400, 'DTCP approved layout, 30ft and 40ft internal roads, avenue plots priced higher. Sales office on site.', 'Casagrand Estates', 4, 'Thalambur Junction 1.2km', 'DTCP/CHN/2274/2023'],
  ['Sriperumbudur Industrial Park', 'Chennai', 'West Chennai', 12.9712, 79.9482, 86, 2400, 6000, 1250, 1900, 'Large-format parcels on the industrial corridor. Phase 1 roads laid, EB substation in place.', 'Arun Land Holdings', 12, 'Sriperumbudur Bypass', 'DTCP/KPM/1180/2022'],
  ['Kelambakkam Lakeview', 'Chennai', 'OMR', 12.7828, 80.2295, 120, 1500, 3000, 1400, 2200, 'Lake-facing layout, panchayat and DTCP approvals in hand. Corner and lake-view plots at a premium.', 'Radiance Landmarks', 7, 'Kelambakkam Lake', 'DTCP/CHN/2611/2024'],
  ['Sarjapur Northgate', 'Bengaluru', 'Sarjapur', 12.8712, 77.7488, 310, 1200, 2400, 3600, 5200, 'BMRDA approved, e-khata ready. 9 phases released, all with formed roads and drains.', 'Northgate Developers', 9, 'Dommasandra 3km', 'BMRDA/AN/447/2023'],
  ['Karjat Valley Parcels', 'Mumbai', 'Outer', 18.9265, 73.3061, 42, 4000, 12000, 800, 1400, 'Second-home land parcels on the valley slope. Motorable access to every parcel.', 'Hilltop Land Co.', 15, 'Karjat Station 9km', 'Collector NA order 2021'],
];

function pickAmenities(seed, count) {
  return AMENITIES.filter((_, ai) => (ai + seed) % 3 !== 0).slice(0, count);
}

export function makeSeedPlots() {
  const plots = SEED.map((r, i) => ({
    id: 'p' + i, locality: r[0], city: r[1], area: r[2], lat: r[3], lng: r[4],
    sqft: r[5], ppsf: r[6], notes: r[7], owner: r[8], days: r[9],
    landmark: r[10], contact: '+91 98' + (400 + i) + ' ' + (10000 + i * 137),
    kind: 'plot', amenities: pickAmenities(i, 3 + (i % 3)),
    media: Array.from({ length: 2 + (i % 3) }, (_, k) => ({
      url: '', bg: shot(i + k), type: i % 4 === 1 && k === 1 ? 'video' : 'photo',
    })),
  }));
  const layouts = LAYOUTS.map((r, i) => ({
    id: 'L' + i, kind: 'layout', locality: r[0], city: r[1], area: r[2], lat: r[3], lng: r[4],
    plots: r[5], sizeMin: r[6], sizeMax: r[7], ppsf: r[8], ppsfMax: r[9],
    notes: r[10], owner: r[11], days: r[12], landmark: r[13], approval: r[14],
    contact: '+91 90' + (300 + i) + ' ' + (22000 + i * 311), amenities: pickAmenities(i + 2, 4 + (i % 3)),
    media: Array.from({ length: 3 }, (_, k) => ({ url: '', bg: shot(i * 2 + k + 1), type: k === 2 ? 'video' : 'photo' })),
  }));
  return plots.concat(layouts);
}
