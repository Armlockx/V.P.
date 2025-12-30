export interface Video {
  id: string;
  title: string;
  url: string;
  thumbnail: string | null;
  duration: string | null;
  order_index: number | null;
  views: number;
  watch_time: number;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface VideoFormData {
  title: string;
  url: string;
  thumbnail: string;
  duration?: string;
  order_index?: number;
}


