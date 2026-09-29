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
  standId: string;
  standName: string;
  blockId: string;
  blockName: string;
  row: number;
  seat: number;
  isDemo: boolean;
}

export type CameraPreset =
  | 'overview'
  | 'top'
  | 'pitch'
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
