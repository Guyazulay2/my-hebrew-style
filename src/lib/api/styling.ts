import { apiFetch } from "./client";

export interface BodyScanResult {
  body_photo_url: string;
  cutout_url: string | null;
  cutout_image: string | null;
  body_type: string | null;
  body_type_label: string | null;
  detected: boolean;
  shoulder_hip_ratio: number | null;
  detection_method: string | null;
  style_note: string;
  confidence: number | null;
  landmarks_count: number | null;
  image_width: number | null;
  image_height: number | null;
  annotated_image: string | null;
  message: string;
}

export async function uploadBodyPhoto(file: File): Promise<BodyScanResult> {
  const form = new FormData();
  form.append("file", file);
  return apiFetch<BodyScanResult>("/api/user/body-photo", {
    method: "POST",
    body: form,
  });
}

export interface StylingItem {
  category: string;
  name: string;
  description: string;
  search_query: string;
  search_results: Array<{
    title: string;
    price: string;
    link: string;
    thumbnail: string;
    source: string;
  }>;
}

export interface StylingResult {
  session_id: string;
  outfit_description: string;
  style_tip: string;
  items: StylingItem[];
}

export async function generateLook(
  event_type: string,
  city: string = "Tel Aviv",
  additional_notes: string = ""
): Promise<StylingResult> {
  return apiFetch<StylingResult>("/api/styling/generate", {
    method: "POST",
    body: JSON.stringify({ event_type, city, additional_notes }),
  });
}

export interface VisualSearchResult {
  search_id: string;
  image_url: string;
  cutout_image: string | null;
  analysis: {
    item_type: string;
    color: string;
    style: string;
    description: string;
    gender?: string;
    search_queries: string[];
  };
  results: Array<{
    title: string;
    price: string;
    link: string;
    thumbnail: string;
    source: string;
  }>;
}

export async function searchByImage(file: File): Promise<VisualSearchResult> {
  const form = new FormData();
  form.append("file", file);
  return apiFetch<VisualSearchResult>("/api/search/image", {
    method: "POST",
    body: form,
  });
}

export interface WardrobeSession {
  id: string;
  event_type: string;
  weather_data: { temp?: number; condition?: string; city?: string } | null;
  outfit_description: string;
  style_tip: string;
  items: StylingItem[];
  items_count: number;
  is_saved: boolean;
  look_title: string | null;
  created_at: string;
}

export async function getWardrobe(): Promise<WardrobeSession[]> {
  return apiFetch<WardrobeSession[]>("/api/styling/wardrobe");
}

export async function toggleSave(
  session_id: string,
  title?: string
): Promise<{ is_saved: boolean; look_title: string | null }> {
  return apiFetch(`/api/styling/${session_id}/save`, {
    method: "POST",
    body: JSON.stringify({ title: title ?? null }),
  });
}

export async function deleteSession(session_id: string): Promise<void> {
  await apiFetch(`/api/styling/${session_id}`, { method: "DELETE" });
}

export interface TryOnResult {
  try_on_image: string;
  mime_type: string;
}

export async function tryOn(session_id: string): Promise<TryOnResult> {
  return apiFetch<TryOnResult>(`/api/styling/${session_id}/try-on`, {
    method: "POST",
  });
}
