import { Coordinate } from "../models/gallery.ts";
import { useContext, useEffect, useRef } from "react";
import { MapTokenContext, MapType } from "../contexts/map_token.tsx";
import useDarkMode from "use-dark-mode";
import { ColorScheme, Map as AppleMap, MapType as AppleMapType, Marker as AppleMarker } from "mapkit-react";
import MapBox, { MapRef, Marker as MapBoxMarker } from 'react-map-gl';

export interface DialogMapProps {
  coordinate: Coordinate
}

export default function DialogMap(props: DialogMapProps) {
  const token = useContext(MapTokenContext)
  const appleRef = useRef<mapkit.Map | null>(null)
  const mapboxRef = useRef<MapRef>(null)
  const darkmode = useDarkMode()

  useEffect(() => {
    if (appleRef && appleRef.current) {
      appleRef.current.setCenterAnimated(new mapkit.Coordinate(props.coordinate.latitude, props.coordinate.longitude), true)
    } else if (mapboxRef && mapboxRef.current) {
      mapboxRef.current.setCenter({lat: props.coordinate.latitude, lng: props.coordinate.longitude})
    }
  }, [props.coordinate.latitude, props.coordinate.longitude])

  if (!token?.token) return;

  return (
    token!.token.type === MapType.Apple ?
      <AppleMap
        token={token!.token.token}
        allowWheelToZoom
        initialRegion={{
          centerLatitude: props.coordinate.latitude,
          centerLongitude: props.coordinate.longitude,
          latitudeDelta: .01,
          longitudeDelta: .01,
        }}
        ref={appleRef}
        colorScheme={darkmode.value ? ColorScheme.Dark : ColorScheme.Light}
        mapType={AppleMapType.MutedStandard}
        showsZoomControl
      >
        <AppleMarker latitude={props.coordinate.latitude} longitude={props.coordinate.longitude}/>
      </AppleMap>
      :
      <MapBox
        mapboxAccessToken={token!.token.token}
        initialViewState={{
          longitude: props.coordinate.longitude,
          latitude: props.coordinate.latitude,
          zoom: 10
        }}
        style={{width: '100%', height: '100%', position: 'absolute'}}
        mapStyle={darkmode.value ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/streets-v12'}
        ref={mapboxRef}
        onRender={(e) => {
          const map = e.target
          map.getStyle().layers.forEach((layer) => {
            if (layer.id.endsWith("-label")) {
              map.setLayoutProperty(layer.id, "text-field", ["get", "name_ja"])
            }
          })
        }}
      >
        <MapBoxMarker
          longitude={props.coordinate.longitude}
          latitude={props.coordinate.latitude}
          color='red'
        />
      </MapBox>
  );
}
