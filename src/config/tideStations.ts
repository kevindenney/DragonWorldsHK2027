export type TideStation = {
  code: string;
  name: string;
  lat: number;
  lon: number;
};

export const TIDE_STATIONS: TideStation[] = [
  {code: 'TMW', name: 'Tai Miu Wan', lat: 22.2846, lon: 114.2878},
  {code: 'QUB', name: 'Quarry Bay', lat: 22.2912, lon: 114.2099},
  {code: 'CCH', name: 'Cheung Chau', lat: 22.2000, lon: 114.0267},
  {code: 'WAG', name: 'Waglan Island', lat: 22.1814, lon: 114.3039}
];