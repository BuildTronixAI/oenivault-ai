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
  estimated_value: string | null;
  created_at: Date;
}
