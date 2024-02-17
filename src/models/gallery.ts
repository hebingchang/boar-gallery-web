export interface Response<T> {
  code: number
  payload: T
  success: boolean
}

export interface Photo {
  id: number
  title: string
  description: string
  author: Author
  metadata: Metadata
  thumb_file: File
  medium_file?: File
}

export interface Author {
  id: number
  name: string
}

export interface Metadata {
  camera: Camera
  lens: Lens
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
}

export interface Camera {
  id: number
  model: string
  manufacture: Manufacture
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
}

export interface Prefecture {
  id: number
  name: string
  country: Country
  // geom_svg: string
  // x_min: number
  // y_min: number
  // x_max: number
  // y_max: number
}

export interface Country {
  id: number
  name: string
}

export interface File {
  height: number
  url: string
  width: number
}
