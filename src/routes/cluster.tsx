import { useContext, useEffect, useRef, useState } from "react";
import { Country, PhotoClusterItem, Response } from "../models/gallery.ts";
import axios from "axios";
import { Card } from "@heroui/react";
import useDarkMode from "use-dark-mode";
import { Annotation, ColorScheme, Map, MapType } from "mapkit-react";
import { MapTokenContext } from "../contexts/map_token.tsx";

export default function ClusterPage() {
  const darkmode = useDarkMode()
  const [clusterItems, setClusterItems] = useState<PhotoClusterItem[]>([])
  const [country, setCountry] = useState<Country>()
  // const [countries, setCountries] = useState<Country[]>([])
  const token = useContext(MapTokenContext)
  const appleRef = useRef<mapkit.Map | null>(null)

  useEffect(() => {
    axios.get<Response<Country[]>>('https://api.gallery.boar.ac.cn/geo/countries').then((res) => {
      // setCountries(res.data.payload)
      setCountry(res.data.payload[0])
    })
  }, []);

  useEffect(() => {
    axios.get<Response<PhotoClusterItem[]>>(`https://api.gallery.boar.ac.cn/photos/cluster?country_id=${country?.id}`).then((res) => {
      setClusterItems(res.data.payload)
    })
  }, [country])

  if (!token?.token) return;
  if (!country) return;

  return <div className='scrollbar-hide box-border relative' style={{ height: 'calc(100dvh - 4rem)' }}>
    <Map
      token={token!.token.token}
      allowWheelToZoom
      ref={appleRef}
      colorScheme={darkmode.value ? ColorScheme.Dark : ColorScheme.Light}
      mapType={MapType.MutedStandard}
      showsZoomControl
      initialRegion={{
        centerLatitude: (country?.extent[3] + country?.extent[1]) / 2,
        centerLongitude: (country?.extent[2] + country?.extent[0]) / 2,
        latitudeDelta: country?.extent[3] - country?.extent[1],
        longitudeDelta: country?.extent[2] - country?.extent[0],
      }}
    >
      {
        clusterItems.map((item) => {
          if (!item.coordinate) return null;

          return <Annotation
            key={item.id}
            latitude={item.coordinate.latitude}
            longitude={item.coordinate.longitude}
            clusteringIdentifier='1'
          >
            <Card
              radius='sm'
              className='border-none'
            >
              <img
                className='object-cover w-[72px] h-[72px]'
                src={item.thumb_file.url}
                width={item.thumb_file.width}
                height={item.thumb_file.height}
              />
            </Card>
          </Annotation>
        })
      }
    </Map>
  </div>
}
