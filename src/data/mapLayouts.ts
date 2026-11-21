import type { CitySlug, LanguageCode } from '../types/sugampath';

export interface CityMapLayout {
  city: CitySlug;
  areaLabel: Record<LanguageCode, string>;
  userPos: { x: number; y: number };
  userAreaRadius: number;
  originLabel: Record<LanguageCode, string>;
  parks: Array<{ x: number; y: number; w: number; h: number; rx?: number }>;
  blocks: Array<{ x: number; y: number; w: number; h: number; rx?: number }>;
  arterialRoads: string[]; // SVG path d
  localRoads: string[]; // SVG path d
  streetLabels: Array<{
    x: number;
    y: number;
    rotate?: number;
    text: Record<LanguageCode, string>;
  }>;
}

export const CITY_MAP_LAYOUTS: Record<CitySlug, CityMapLayout> = {
  patiala: {
    city: 'patiala',
    areaLabel: {
      en: 'Patiala Central · Current area',
      hi: 'पटियाला सेंट्रल · मौजूदा क्षेत्र',
      pa: 'ਪਟਿਆਲਾ ਸੈਂਟਰਲ · ਮੌਜੂਦਾ ਇਲਾਕਾ',
    },
    userPos: { x: 350, y: 230 },
    userAreaRadius: 185,
    originLabel: {
      en: 'Fountain Chowk (You)',
      hi: 'फव्वारा चौक (आप)',
      pa: 'ਫੁਹਾਰਾ ਚੌਕ (ਤੁਸੀਂ)',
    },
    parks: [
      { x: 140, y: 95, w: 120, h: 85, rx: 12 },
      { x: 525, y: 275, w: 145, h: 110, rx: 14 },
      { x: 155, y: 295, w: 95, h: 115, rx: 12 },
    ],
    blocks: [
      { x: 280, y: 80, w: 110, h: 90, rx: 10 },
      { x: 420, y: 75, w: 140, h: 95, rx: 10 },
      { x: 590, y: 85, w: 170, h: 75, rx: 10 },
      { x: 280, y: 265, w: 110, h: 95, rx: 10 },
      { x: 415, y: 275, w: 90, h: 105, rx: 10 },
      { x: 695, y: 225, w: 130, h: 110, rx: 10 },
    ],
    arterialRoads: [
      'M 80 228 L 880 228',
      'M 470 40 L 470 450',
      'M 250 365 L 470 228 L 740 175',
    ],
    localRoads: [
      'M 120 190 L 820 190',
      'M 160 270 L 790 270',
      'M 350 65 L 350 420',
      'M 615 60 L 615 410',
      'M 350 230 L 410 268 L 494 238',
    ],
    streetLabels: [
      {
        x: 255,
        y: 184,
        text: { en: 'STATION ROAD', hi: 'स्टेशन रोड', pa: 'ਸਟੇਸ਼ਨ ਰੋਡ' },
      },
      {
        x: 615,
        y: 162,
        rotate: -12,
        text: { en: 'RAJPURA ROAD', hi: 'राजपुरा रोड', pa: 'ਰਾਜਪੁਰਾ ਰੋਡ' },
      },
      {
        x: 345,
        y: 325,
        text: { en: 'MALL ROAD', hi: 'मॉल रोड', pa: 'ਮਾਲ ਰੋਡ' },
      },
    ],
  },
  'new-delhi': {
    city: 'new-delhi',
    areaLabel: {
      en: 'Central Delhi · Current area',
      hi: 'सेंट्रल दिल्ली · मौजूदा क्षेत्र',
      pa: 'ਸੈਂਟਰਲ ਦਿੱਲੀ · ਮੌਜੂਦਾ ਇਲਾਕਾ',
    },
    userPos: { x: 370, y: 270 },
    userAreaRadius: 195,
    originLabel: {
      en: 'Radial Road 3 (You)',
      hi: 'रेडियल रोड 3 (आप)',
      pa: 'ਰੇਡੀਅਲ ਰੋਡ 3 (ਤੁਸੀਂ)',
    },
    parks: [
      { x: 170, y: 175, w: 115, h: 95, rx: 14 },
      { x: 540, y: 270, w: 140, h: 105, rx: 14 },
      { x: 490, y: 145, w: 95, h: 70, rx: 12 },
    ],
    blocks: [
      { x: 310, y: 145, w: 110, h: 75, rx: 10 },
      { x: 315, y: 300, w: 115, h: 85, rx: 10 },
      { x: 475, y: 300, w: 115, h: 85, rx: 10 },
      { x: 650, y: 150, w: 140, h: 95, rx: 10 },
      { x: 165, y: 315, w: 115, h: 95, rx: 10 },
    ],
    arterialRoads: [
      'M 100 245 L 860 245',
      'M 460 40 L 460 460',
      'M 320 430 L 460 245 L 640 98',
    ],
    localRoads: [
      'M 160 120 L 760 120',
      'M 210 270 L 720 270',
      'M 370 100 L 370 400',
      'M 580 75 L 580 410',
    ],
    streetLabels: [
      {
        x: 265,
        y: 238,
        text: { en: 'CONNAUGHT CIRCLE', hi: 'कनॉट सर्कल', pa: 'ਕਨਾਟ ਸਰਕਲ' },
      },
      {
        x: 545,
        y: 112,
        text: { en: 'AJMERI GATE MARG', hi: 'अजमेरी गेट मार्ग', pa: 'ਅਜਮੇਰੀ ਗੇਟ ਮਾਰਗ' },
      },
      {
        x: 345,
        y: 395,
        text: { en: 'PANCHSHEEL MARG', hi: 'पंचशील मार्ग', pa: 'ਪੰਚਸ਼ੀਲ ਮਾਰਗ' },
      },
    ],
  },
  chandigarh: {
    city: 'chandigarh',
    areaLabel: {
      en: 'Sector 17 & Station · Current area',
      hi: 'सेक्टर 17 और स्टेशन · मौजूदा क्षेत्र',
      pa: 'ਸੈਕਟਰ 17 ਅਤੇ ਸਟੇਸ਼ਨ · ਮੌਜੂਦਾ ਇਲਾਕਾ',
    },
    userPos: { x: 610, y: 285 },
    userAreaRadius: 190,
    originLabel: {
      en: 'Railway Chowk (You)',
      hi: 'रेलवे चौक (आप)',
      pa: 'ਰੇਲਵੇ ਚੌਕ (ਤੁਸੀਂ)',
    },
    parks: [
      { x: 165, y: 175, w: 115, h: 115, rx: 14 },
      { x: 520, y: 120, w: 140, h: 95, rx: 14 },
      { x: 340, y: 310, w: 120, h: 95, rx: 12 },
    ],
    blocks: [
      { x: 330, y: 110, w: 135, h: 85, rx: 10 },
      { x: 515, y: 325, w: 130, h: 85, rx: 10 },
      { x: 685, y: 145, w: 130, h: 90, rx: 10 },
      { x: 165, y: 320, w: 135, h: 85, rx: 10 },
    ],
    arterialRoads: [
      'M 120 265 L 860 285',
      'M 310 145 L 480 265 L 760 310',
      'M 480 50 L 480 450',
    ],
    localRoads: [
      'M 160 145 L 820 145',
      'M 200 365 L 820 365',
      'M 310 60 L 310 440',
      'M 640 60 L 640 440',
    ],
    streetLabels: [
      {
        x: 365,
        y: 210,
        rotate: 28,
        text: { en: 'MADHYA MARG', hi: 'मध्य मार्ग', pa: 'ਮੱਧਿਆ ਮਾਰਗ' },
      },
      {
        x: 565,
        y: 268,
        text: { en: 'UDYOG PATH', hi: 'उद्योग पथ', pa: 'ਉਦਯੋਗ ਪੱਥ' },
      },
      {
        x: 685,
        y: 355,
        text: { en: 'STATION WAY', hi: 'स्टेशन रोड', pa: 'ਸਟੇਸ਼ਨ ਰੋਡ' },
      },
    ],
  },
};
