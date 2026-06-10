import { apiFetch } from "./client";

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
  analysis: {
    item_type: string;
    color: string;
    style: string;
    description: string;
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
