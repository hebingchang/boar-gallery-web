import React, { createContext } from "react";

export enum MapType {
  Apple,
  Baidu
}

export interface MapToken {
  type: MapType,
  token: string
}

export const MapTokenContext = createContext<{
  token: MapToken,
  setToken: React.Dispatch<React.SetStateAction<MapToken>>
} | null>(null);
