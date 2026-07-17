export type UserRole = 'admin' | 'customer';

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  facility_id: string | null;
  created_at?: string;
  updated_at?: string;
  collection_count?: number;
  wine_count?: number;
  collections?: Collection[];
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface Collection {
  id: string;
  customer_id: string;
  facility_id: string;
  name: string;
  total_cases: number;
  created_at: string;
  customer_name?: string;
  customer_email?: string;
  wine_count?: number;
  total_value?: string | number;
}

export interface Wine {
  id: string;
  collection_id: string;
  name: string;
  vintage: number | null;
  region: string | null;
  varietal: string | null;
  quantity: number;
  location_code: string | null;
  notes: string | null;
  estimated_value: string | number | null;
  created_at: string;
  collection_name?: string;
  customer_name?: string | null;
  customer_id?: string;
}

export interface WineInput {
  collectionId: string;
  name: string;
  vintage?: number | null;
  region?: string | null;
  varietal?: string | null;
  quantity: number;
  locationCode?: string | null;
  notes?: string | null;
  estimatedValue?: number | null;
}

export interface Alert {
  id: string;
  facility_id: string | null;
  alert_type: string | null;
  severity: string | null;
  message: string | null;
  resolved: boolean;
  created_at: string;
}
