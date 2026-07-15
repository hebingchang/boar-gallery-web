import axios from "axios";
import type { Coordinate, Place, Response } from "../models/gallery.ts";

const API_ORIGIN = "https://api.gallery.boar.ac.cn";

export async function queryPlaces(name: string, signal?: AbortSignal): Promise<Place[]> {
  const response = await axios.get<Response<Place[]>>(`${API_ORIGIN}/places`, {
    params: {
      name: name.trim() || undefined,
      limit: 50,
    },
    signal,
  });
  return response.data.payload;
}

export async function createPlace(
  name: string,
  geom: Coordinate,
  token: string,
): Promise<Place> {
  const response = await axios.post<Response<Place>>(
    `${API_ORIGIN}/places`,
    { name: name.trim(), geom },
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return response.data.payload;
}
