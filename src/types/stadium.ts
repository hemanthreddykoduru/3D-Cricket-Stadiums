export interface Stadium {
  id: string;
  slug: string;
  name: string;
  city: string;
  state: string;
  country: "India";
  capacity?: number;
  opened?: number;
  association?: string;
  description?: string;
  modelStatus: "available" | "in-development" | "coming-soon";
  stadiumModel?: string;
  environmentModel?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  featured?: boolean;
}

export interface SelectedSeat {
  id: string;
  standId: string;
  standName: string;
  blockId: string;
  blockName: string;
  row: number;
  seat: number;
  isDemo: boolean;
  /** Actual GLB instance origin in world metres (+Y up). */
  position: [number, number, number];
  /** Seated spectator eye position, derived from that instance. */
  eyePosition: [number, number, number];
  /** Playing-field focus point in the same coordinate system. */
  target: [number, number, number];
}

export interface SeatRow {
  number: number;
  seats: SelectedSeat[];
}

export interface SeatPavilion {
  id: string;
  name: string;
  tier: 'lower' | 'upper' | 'single';
  rows: SeatRow[];
}

export interface SeatMap {
  pavilions: SeatPavilion[];
  seatCount: number;
  numbering: 'model';
}

export type CameraPreset =
  | 'overview'
  | 'top'
  | 'pitch'
  | 'stand'
  | 'north'
  | 'south'
  | 'east'
  | 'west'
  | 'seat';

export type LayerKey =
  | 'stadium'
  | 'stands'
  | 'seats'
  | 'environment'
  | 'roads'
  | 'buildings'
  | 'trees'
  | 'parking'
  | 'gates'
  | 'food'
  | 'restrooms'
  | 'accessibility';
