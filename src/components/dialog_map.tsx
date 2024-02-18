import { Coordinate } from "../models/gallery.ts";
import { useContext } from "react";
import { MapTokenContext, MapType } from "../contexts/map_token.tsx";
import useDarkMode from "use-dark-mode";
import { ColorScheme, Map as AppleMap, MapType as AppleMapType, Marker as AppleMarker } from "mapkit-react";
import { Map as BaiduMap, APILoader, Marker as BaiduMarker, Provider } from '@uiw/react-baidu-map';

export interface DialogMapProps {
  coordinate: Coordinate
}

export default function DialogMap(props: DialogMapProps) {
  const token = useContext(MapTokenContext)
  const darkmode = useDarkMode()

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
        colorScheme={darkmode.value ? ColorScheme.Dark : ColorScheme.Light}
        mapType={AppleMapType.MutedStandard}
        showsZoomControl
      >
        <AppleMarker latitude={props.coordinate.latitude} longitude={props.coordinate.longitude}/>
      </AppleMap>
      :
      <APILoader akay={token!.token.token}>
        <Provider>
          <BaiduMap
            center={{lat: props.coordinate.latitude, lng: props.coordinate.longitude}}
            enableScrollWheelZoom
          >
            {({BMap, map}) => {
              map.setMapStyle({
                features: [],
                style: darkmode.value ? 'dark' : 'normal'
              })
              const icon = new BMap.Symbol(BMap_Symbol_SHAPE_POINT, {
                scale: 1.2,
                fillColor: "#d81e06",
                fillOpacity: 0.8,
              })

              return <BaiduMarker
                position={{lat: props.coordinate.latitude, lng: props.coordinate.longitude}}
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                icon={icon}
              />;
            }}
          </BaiduMap>
        </Provider>
      </APILoader>
  );
}
