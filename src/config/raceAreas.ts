export type RaceArea = {
  key: string;
  name: string;
  lat: number;
  lon: number;
  radiusKm: number;
};

export const RACE_AREAS: RaceArea[] = [
  {key: 'ninePins', name: 'Nine Pins Racing Area', lat: 22.25956857275924, lon: 114.32476115742637, radiusKm: 15},
  {key: 'victoriaHarbor', name: 'Victoria Harbour', lat: 22.303318597609636, lon: 114.2038108583098, radiusKm: 15},
  {key: 'lammaChannel', name: 'Lamma Channel', lat: 22.188201331198687, lon: 114.16711620699334, radiusKm: 15},
  {key: 'middleIsland', name: 'Middle Island', lat: 22.233446406278613, lon: 114.17805406015323, radiusKm: 15},
  {key: 'portShelter', name: 'Port Shelter', lat: 22.343633807066116, lon: 114.28686331318761, radiusKm: 15}
];