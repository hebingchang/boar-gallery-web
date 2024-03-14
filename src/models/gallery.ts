export interface Response<T> {
  code: number
  payload: T
  success: boolean
}

export interface Photo {
  id: number
  title: string
  description: string
  author?: Author
  metadata: Metadata
  thumb_file: File
  medium_file?: File
  large_file?: File
}

export interface Author {
  id: number
  name: string
}

export interface Metadata {
  camera?: Camera
  lens?: Lens
  has_location?: boolean
  location?: Coordinate
  datetime: string
  exposure_time: number
  exposure_time_rat: string
  f_number: number
  photographic_sensitivity: number
  focal_length: number
  city?: City
  place?: Place
  timezone: string
  altitude?: number
}

export interface Camera {
  id: number
  model: string
  manufacture: Manufacture
  general_name?: string
}

export interface Manufacture {
  id: number
  name: string
}

export interface Place {
  id: number
  name: string
  geom: Coordinate
}

export interface Coordinate {
  longitude: number
  latitude: number
}

export interface Lens {
  id: number
  model: string
  manufacture: Manufacture
  min_focal_length: number
  max_focal_length: number
  min_f_number_in_min_focal_length: number
  min_f_number_in_max_focal_length: number
}

export interface City {
  id: number
  name: string
  prefecture: Prefecture
  photos_count: number
}

export interface Prefecture {
  id: number
  name: string
  country: Country
  photos_count?: number
  cities: City[]
}

export interface Country {
  id: number
  name: string
  code: string
  center: [number, number]
  extent: [number, number, number, number]
  zoom: [number, number, number]
}

export interface File {
  height: number
  url: string
  width: number
}
