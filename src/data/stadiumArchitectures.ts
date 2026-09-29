export type RoofType = 'none' | 'cantilever' | 'ring' | 'segmented' | 'modern' | 'mixed' | 'historic';
export type BowlShape = 'oval' | 'circular' | 'asymmetric' | 'rectangular' | 'compact';

export interface StandConfig {
  id: string;
  name: string;
  angleStart: number;
  angleEnd: number;
  width: number;
  height: number;
  tiers: number;
  roof: RoofType;
  color?: string;
}

export interface PavilionConfig {
  position: [number, number, number];
  width: number;
  height: number;
  depth: number;
  rotation?: number;
}

export interface FloodlightConfig {
  position: [number, number, number];
  height: number;
  rotation: number;
}

export interface StadiumArchitecture {
  stadiumId: string;
  bowl: {
    shape: BowlShape;
    radiusX: number;
    radiusZ: number;
    rotation: number;
  };
  stands: StandConfig[];
  pavilions: PavilionConfig[];
  floodlights: FloodlightConfig[];
}

export const architectures: Record<string, StadiumArchitecture> = {
  'narendra-modi-stadium': {
    stadiumId: 'narendra-modi-stadium',
    bowl: { shape: 'circular', radiusX: 75, radiusZ: 75, rotation: 0 },
    stands: [
      { id: 'north', name: 'North Stand', angleStart: -0.8, angleEnd: 0.8, width: 25, height: 20, tiers: 3, roof: 'modern', color: '#103060' },
      { id: 'east', name: 'East Stand', angleStart: 0.8, angleEnd: 2.3, width: 25, height: 20, tiers: 3, roof: 'modern', color: '#103060' },
      { id: 'south', name: 'South Stand', angleStart: 2.3, angleEnd: 3.9, width: 25, height: 20, tiers: 3, roof: 'modern', color: '#103060' },
      { id: 'west', name: 'West Stand', angleStart: 3.9, angleEnd: 5.4, width: 25, height: 20, tiers: 3, roof: 'modern', color: '#103060' }
    ],
    pavilions: [
      { position: [-80, 10, 0], width: 30, height: 25, depth: 15, rotation: Math.PI / 2 }
    ],
    floodlights: [
      { position: [70, 0, 70], height: 50, rotation: -Math.PI / 4 },
      { position: [-70, 0, 70], height: 50, rotation: -3 * Math.PI / 4 },
      { position: [70, 0, -70], height: 50, rotation: Math.PI / 4 },
      { position: [-70, 0, -70], height: 50, rotation: 3 * Math.PI / 4 },
      { position: [90, 0, 0], height: 50, rotation: -Math.PI / 2 },
      { position: [-90, 0, 0], height: 50, rotation: Math.PI / 2 }
    ]
  },
  'wankhede-stadium': {
    stadiumId: 'wankhede-stadium',
    bowl: { shape: 'compact', radiusX: 55, radiusZ: 60, rotation: 0 },
    stands: [
      { id: 'garware', name: 'Garware Pavilion', angleStart: -0.5, angleEnd: 0.5, width: 18, height: 16, tiers: 2, roof: 'cantilever', color: '#b26e2e' },
      { id: 'north', name: 'Tata End', angleStart: 0.6, angleEnd: 2.5, width: 15, height: 12, tiers: 2, roof: 'cantilever', color: '#444444' },
      { id: 'mca', name: 'MCA Pavilion', angleStart: 2.6, angleEnd: 3.6, width: 22, height: 18, tiers: 3, roof: 'cantilever', color: '#b26e2e' },
      { id: 'south', name: 'Divecha Pavilion', angleStart: 3.7, angleEnd: 5.7, width: 15, height: 12, tiers: 2, roof: 'cantilever', color: '#444444' }
    ],
    pavilions: [
      { position: [0, 8, -65], width: 40, height: 20, depth: 15, rotation: 0 },
      { position: [0, 8, 65], width: 30, height: 18, depth: 12, rotation: Math.PI }
    ],
    floodlights: [
      { position: [50, 0, 55], height: 40, rotation: -Math.PI / 4 },
      { position: [-50, 0, 55], height: 40, rotation: -3 * Math.PI / 4 },
      { position: [50, 0, -55], height: 40, rotation: Math.PI / 4 },
      { position: [-50, 0, -55], height: 40, rotation: 3 * Math.PI / 4 }
    ]
  },
  'm-chinnaswamy-stadium': {
    stadiumId: 'm-chinnaswamy-stadium',
    bowl: { shape: 'asymmetric', radiusX: 58, radiusZ: 52, rotation: 0 },
    stands: [
      { id: 'pavilion', name: 'Pavilion End', angleStart: -0.4, angleEnd: 0.4, width: 20, height: 15, tiers: 2, roof: 'historic', color: '#c43a3a' },
      { id: 'east', name: 'East Stand', angleStart: 0.5, angleEnd: 2.6, width: 14, height: 10, tiers: 1, roof: 'none', color: '#888888' },
      { id: 'beml', name: 'BEML End', angleStart: 2.7, angleEnd: 3.5, width: 16, height: 14, tiers: 2, roof: 'segmented', color: '#c43a3a' },
      { id: 'west', name: 'West Stand', angleStart: 3.6, angleEnd: 5.8, width: 14, height: 10, tiers: 1, roof: 'none', color: '#888888' }
    ],
    pavilions: [
      { position: [0, 6, -58], width: 35, height: 16, depth: 10, rotation: 0 }
    ],
    floodlights: [
      { position: [48, 0, 48], height: 45, rotation: -Math.PI / 4 },
      { position: [-48, 0, 48], height: 45, rotation: -3 * Math.PI / 4 },
      { position: [48, 0, -48], height: 45, rotation: Math.PI / 4 },
      { position: [-48, 0, -48], height: 45, rotation: 3 * Math.PI / 4 }
    ]
  },
  'eden-gardens': {
    stadiumId: 'eden-gardens',
    bowl: { shape: 'oval', radiusX: 68, radiusZ: 62, rotation: 0 },
    stands: [
      { id: 'clubhouse', name: 'Club House', angleStart: -0.6, angleEnd: 0.6, width: 22, height: 18, tiers: 2, roof: 'historic', color: '#2a5a2a' },
      { id: 'b-block', name: 'B Block', angleStart: 0.7, angleEnd: 2.4, width: 18, height: 16, tiers: 2, roof: 'ring', color: '#dddddd' },
      { id: 'high-court', name: 'High Court End', angleStart: 2.5, angleEnd: 3.7, width: 20, height: 17, tiers: 2, roof: 'historic', color: '#2a5a2a' },
      { id: 'g-block', name: 'G Block', angleStart: 3.8, angleEnd: 5.5, width: 18, height: 16, tiers: 2, roof: 'ring', color: '#dddddd' }
    ],
    pavilions: [
      { position: [0, 8, -68], width: 45, height: 22, depth: 18, rotation: 0 }
    ],
    floodlights: [
      { position: [60, 0, 55], height: 55, rotation: -Math.PI / 4 },
      { position: [-60, 0, 55], height: 55, rotation: -3 * Math.PI / 4 },
      { position: [60, 0, -55], height: 55, rotation: Math.PI / 4 },
      { position: [-60, 0, -55], height: 55, rotation: 3 * Math.PI / 4 }
    ]
  },
  'ma-chidambaram-stadium': {
    stadiumId: 'ma-chidambaram-stadium',
    bowl: { shape: 'compact', radiusX: 56, radiusZ: 56, rotation: 0 },
    stands: [
      { id: 'pavilion', name: 'Madras Cricket Club', angleStart: -0.3, angleEnd: 0.3, width: 15, height: 12, tiers: 2, roof: 'historic', color: '#d2b48c' },
      { id: 'anna', name: 'Anna Pavilion', angleStart: 0.4, angleEnd: 2.7, width: 18, height: 15, tiers: 2, roof: 'segmented', color: '#ffcc00' },
      { id: 'pattabhiraman', name: 'Pattabhiraman Gate', angleStart: 2.8, angleEnd: 3.4, width: 16, height: 14, tiers: 2, roof: 'none', color: '#dddddd' },
      { id: 'wallajah', name: 'Wallajah Road End', angleStart: 3.5, angleEnd: 5.9, width: 18, height: 15, tiers: 2, roof: 'segmented', color: '#ffcc00' }
    ],
    pavilions: [
      { position: [0, 5, -56], width: 25, height: 15, depth: 12, rotation: 0 }
    ],
    floodlights: [
      { position: [50, 0, 50], height: 42, rotation: -Math.PI / 4 },
      { position: [-50, 0, 50], height: 42, rotation: -3 * Math.PI / 4 },
      { position: [50, 0, -50], height: 42, rotation: Math.PI / 4 },
      { position: [-50, 0, -50], height: 42, rotation: 3 * Math.PI / 4 }
    ]
  },
  'rajiv-gandhi-stadium': {
    stadiumId: 'rajiv-gandhi-stadium',
    bowl: { shape: 'oval', radiusX: 65, radiusZ: 60, rotation: 0 },
    stands: [
      { id: 'north', name: 'North Pavilion', angleStart: -0.7, angleEnd: 0.7, width: 22, height: 18, tiers: 2, roof: 'modern', color: '#ff6600' },
      { id: 'east', name: 'East Stand', angleStart: 0.8, angleEnd: 2.3, width: 18, height: 14, tiers: 2, roof: 'none', color: '#cccccc' },
      { id: 'south', name: 'South Pavilion', angleStart: 2.4, angleEnd: 3.8, width: 22, height: 18, tiers: 2, roof: 'modern', color: '#ff6600' },
      { id: 'west', name: 'West Stand', angleStart: 3.9, angleEnd: 5.4, width: 18, height: 14, tiers: 2, roof: 'none', color: '#cccccc' }
    ],
    pavilions: [
      { position: [0, 8, -65], width: 40, height: 20, depth: 15, rotation: 0 },
      { position: [0, 8, 65], width: 40, height: 20, depth: 15, rotation: Math.PI }
    ],
    floodlights: [
      { position: [55, 0, 55], height: 48, rotation: -Math.PI / 4 },
      { position: [-55, 0, 55], height: 48, rotation: -3 * Math.PI / 4 },
      { position: [55, 0, -55], height: 48, rotation: Math.PI / 4 },
      { position: [-55, 0, -55], height: 48, rotation: 3 * Math.PI / 4 },
      { position: [70, 0, 0], height: 48, rotation: -Math.PI / 2 },
      { position: [-70, 0, 0], height: 48, rotation: Math.PI / 2 }
    ]
  },
  'arun-jaitley-stadium': {
    stadiumId: 'arun-jaitley-stadium',
    bowl: { shape: 'asymmetric', radiusX: 52, radiusZ: 58, rotation: Math.PI / 8 },
    stands: [
      { id: 'old-pavilion', name: 'Old Pavilion', angleStart: -0.4, angleEnd: 0.4, width: 16, height: 12, tiers: 2, roof: 'historic', color: '#335588' },
      { id: 'east', name: 'East Stand', angleStart: 0.5, angleEnd: 2.5, width: 20, height: 15, tiers: 3, roof: 'cantilever', color: '#555555' },
      { id: 'south', name: 'South Stand', angleStart: 2.6, angleEnd: 3.6, width: 14, height: 10, tiers: 1, roof: 'none', color: '#888888' },
      { id: 'west', name: 'West Stand', angleStart: 3.7, angleEnd: 5.7, width: 20, height: 15, tiers: 3, roof: 'cantilever', color: '#555555' }
    ],
    pavilions: [
      { position: [0, 6, -55], width: 30, height: 15, depth: 12, rotation: 0 }
    ],
    floodlights: [
      { position: [45, 0, 50], height: 40, rotation: -Math.PI / 4 },
      { position: [-45, 0, 50], height: 40, rotation: -3 * Math.PI / 4 },
      { position: [45, 0, -50], height: 40, rotation: Math.PI / 4 },
      { position: [-45, 0, -50], height: 40, rotation: 3 * Math.PI / 4 }
    ]
  },
  'ekana-stadium': {
    stadiumId: 'ekana-stadium',
    bowl: { shape: 'circular', radiusX: 68, radiusZ: 68, rotation: 0 },
    stands: [
      { id: 'north', name: 'North Pavilion', angleStart: -0.6, angleEnd: 0.6, width: 24, height: 18, tiers: 2, roof: 'modern', color: '#1a5b88' },
      { id: 'east', name: 'East Stand', angleStart: 0.7, angleEnd: 2.4, width: 20, height: 16, tiers: 2, roof: 'ring', color: '#dddddd' },
      { id: 'south', name: 'South Pavilion', angleStart: 2.5, angleEnd: 3.7, width: 24, height: 18, tiers: 2, roof: 'modern', color: '#1a5b88' },
      { id: 'west', name: 'West Stand', angleStart: 3.8, angleEnd: 5.5, width: 20, height: 16, tiers: 2, roof: 'ring', color: '#dddddd' }
    ],
    pavilions: [
      { position: [0, 10, -68], width: 45, height: 22, depth: 18, rotation: 0 },
      { position: [0, 10, 68], width: 45, height: 22, depth: 18, rotation: Math.PI }
    ],
    floodlights: [
      { position: [60, 0, 60], height: 50, rotation: -Math.PI / 4 },
      { position: [-60, 0, 60], height: 50, rotation: -3 * Math.PI / 4 },
      { position: [60, 0, -60], height: 50, rotation: Math.PI / 4 },
      { position: [-60, 0, -60], height: 50, rotation: 3 * Math.PI / 4 }
    ]
  },
  'maharashtra-cricket-association-stadium': {
    stadiumId: 'maharashtra-cricket-association-stadium',
    bowl: { shape: 'oval', radiusX: 60, radiusZ: 65, rotation: 0 },
    stands: [
      { id: 'north', name: 'North Stand', angleStart: -0.8, angleEnd: 0.8, width: 18, height: 15, tiers: 2, roof: 'cantilever', color: '#2a4a8a' },
      { id: 'east', name: 'East Stand', angleStart: 0.9, angleEnd: 2.2, width: 16, height: 12, tiers: 2, roof: 'none', color: '#eeeeee' },
      { id: 'south', name: 'South Pavilion', angleStart: 2.3, angleEnd: 3.9, width: 22, height: 18, tiers: 3, roof: 'modern', color: '#2a4a8a' },
      { id: 'west', name: 'West Stand', angleStart: 4.0, angleEnd: 5.3, width: 16, height: 12, tiers: 2, roof: 'none', color: '#eeeeee' }
    ],
    pavilions: [
      { position: [0, 8, 65], width: 35, height: 20, depth: 15, rotation: Math.PI }
    ],
    floodlights: [
      { position: [55, 0, 55], height: 45, rotation: -Math.PI / 4 },
      { position: [-55, 0, 55], height: 45, rotation: -3 * Math.PI / 4 },
      { position: [55, 0, -55], height: 45, rotation: Math.PI / 4 },
      { position: [-55, 0, -55], height: 45, rotation: 3 * Math.PI / 4 }
    ]
  },
  'sawai-mansingh-stadium': {
    stadiumId: 'sawai-mansingh-stadium',
    bowl: { shape: 'rectangular', radiusX: 58, radiusZ: 62, rotation: 0 },
    stands: [
      { id: 'pavilion', name: 'President Pavilion', angleStart: -0.5, angleEnd: 0.5, width: 20, height: 15, tiers: 2, roof: 'historic', color: '#8b4513' },
      { id: 'east', name: 'East Stand', angleStart: 0.6, angleEnd: 2.5, width: 16, height: 12, tiers: 2, roof: 'none', color: '#dddddd' },
      { id: 'south', name: 'South Stand', angleStart: 2.6, angleEnd: 3.6, width: 18, height: 14, tiers: 2, roof: 'cantilever', color: '#cc7722' },
      { id: 'west', name: 'West Stand', angleStart: 3.7, angleEnd: 5.6, width: 16, height: 12, tiers: 2, roof: 'none', color: '#dddddd' }
    ],
    pavilions: [
      { position: [0, 8, -62], width: 30, height: 18, depth: 12, rotation: 0 }
    ],
    floodlights: [
      { position: [50, 0, 55], height: 42, rotation: -Math.PI / 4 },
      { position: [-50, 0, 55], height: 42, rotation: -3 * Math.PI / 4 },
      { position: [50, 0, -55], height: 42, rotation: Math.PI / 4 },
      { position: [-50, 0, -55], height: 42, rotation: 3 * Math.PI / 4 }
    ]
  }
};
