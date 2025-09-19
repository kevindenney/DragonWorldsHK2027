import {TIDE_STATIONS} from '../config/tideStations';

export type Nearest = {
  code: string;
  name: string;
  distanceKm: number;
};

const R = 6371; // Earth radius in km
const toRad = (d: number) => d * Math.PI / 180;

const distKm = (a: {lat: number; lon: number}, b: {lat: number; lon: number}) => {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const la1 = toRad(a.lat);
  const la2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

export const getNearestTideStation = (lat: number, lon: number) => {
  let best = Infinity;
  let pick: null | Nearest = null;

  for (const s of TIDE_STATIONS) {
    const d = distKm({lat, lon}, s);
    if (d < best) {
      best = d;
      pick = {code: s.code, name: s.name, distanceKm: d};
    }
  }

  return pick && pick.distanceKm <= 30 ? pick : null;
};