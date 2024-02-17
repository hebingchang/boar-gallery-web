import { Coordinate } from "../models/gallery.ts";
import { ColorScheme, Map, MapType, Marker } from "mapkit-react";
import { useContext } from "react";
import { MapTokenContext } from "../contexts/map_token.tsx";
import useDarkMode from "use-dark-mode";

export interface DialogMapProps {
  coordinate: Coordinate
}

export default function DialogMap(props: DialogMapProps) {
  const token = useContext(MapTokenContext)
  const darkmode = useDarkMode()

  return (
    <Map
      token={token!.token}
      allowWheelToZoom
      initialRegion={{
        centerLatitude: props.coordinate.latitude,
        centerLongitude: props.coordinate.longitude,
        latitudeDelta: .01,
        longitudeDelta: .01,
      }}
      colorScheme={darkmode.value ? ColorScheme.Dark : ColorScheme.Light}
      mapType={MapType.MutedStandard}
      showsZoomControl
    >
      <Marker latitude={props.coordinate.latitude} longitude={props.coordinate.longitude}/>
    </Map>
  );
}
