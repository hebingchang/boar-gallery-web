import { useEffect, useRef, useState } from "react";
import { Country, Prefecture, Response } from "../models/gallery.ts";
import axios from "axios";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from 'ol/format/GeoJSON';
import { fromLonLat, transformExtent } from "ol/proj";
import { View } from "ol";
import Map from 'ol/Map.js';
import { Fill, Stroke, Style, Text } from 'ol/style.js';
import { getArea } from 'ol/sphere';
import { MultiPolygon } from "ol/geom";
import { useTranslation } from "react-i18next";
import { Select, SelectItem } from "@nextui-org/react";
import useDarkMode from "use-dark-mode";
import { useNavigate } from "react-router-dom";

export default function MapPage() {
  const darkmode = useDarkMode()
  const mapElement = useRef<HTMLDivElement>(null)
  const map = useRef<Map>()
  const [country, setCountry] = useState<Country>()
  const [countries, setCountries] = useState<Country[]>([])
  const [prefectures, setPrefectures] = useState<Prefecture[]>([])
  const hoverIds = useRef<number[]>([]);
  const navigate = useNavigate()
  const {t} = useTranslation()

  useEffect(() => {
    axios.get<Response<Country[]>>('https://api.gallery.boar.ac.cn/geo/countries').then((res) => {
      setCountries(res.data.payload)
      setCountry(res.data.payload[0])
    })
  }, [])

  useEffect(() => {
    if (country) {
      axios.get<Response<Prefecture[]>>('https://api.gallery.boar.ac.cn/geo/prefectures', {
        params: {
          country_id: country.id,
          with_photos_count: true
        }
      }).then((res) => {
        setPrefectures(res.data.payload)
      })
    }
  }, [country])

  useEffect(() => {
      if (!country) return
      if (!mapElement || !mapElement.current) return
      if (!prefectures.length) return
      if (!navigate) return

      if (map.current) {
        map.current?.setTarget(undefined)
      }

      // create and add vector source layer
      const vectorLayer = new VectorLayer({
        source: new VectorSource({
          url: `/geojson/${country.code}.json`,
          format: new GeoJSON(),
        }),
        renderBuffer: Math.max(window.outerWidth, window.outerHeight),
        style: function (feature) {
          if (feature.getGeometry()?.getType() === 'MultiPolygon') {
            const hasPhotos = (prefectures.find((p) => p.id === feature.get('id'))?.photos_count ?? 0) > 0

            let largestPolygon = null;
            let maxArea = 0;

            (feature.getGeometry() as MultiPolygon).getPolygons().forEach((polygon) => {
              const area = getArea(polygon);
              if (area > maxArea) {
                maxArea = area;
                largestPolygon = polygon;
              }
            });

            const labelStyle = new Style({
              text: new Text({
                font: '13px "SF Pro SC","SF Pro Display","SF Pro Icons","PingFang SC","Helvetica Neue","Helvetica","Arial",sans-serif',
                overflow: true,
                fill: new Fill({
                  color: darkmode.value ? '#fff' : '#000',
                }),
                stroke: new Stroke({
                  color: darkmode.value ? '#000' : '#fff',
                  width: 3,
                }),
                text: feature.get('name'),
              }),
              geometry: new MultiPolygon([largestPolygon!.getCoordinates()]),
            });

            const prefStyle = new Style({
              fill: new Fill({
                color: (hasPhotos ?
                  darkmode.value ? '#792A4C' : '#FEDFE1' :
                  darkmode.value ? '#222222' : '#DDDDDD') + (hoverIds.current.includes(feature.get('id')) ? 'CC' : 'FF'),
              }),
              stroke: new Stroke({
                color: darkmode.value ? '#000' : '#FFF',
                width: 1,
              }),
            });

            return [prefStyle, labelStyle]
          }
        },
        declutter: true,
      })

      // create map
      map.current = new Map({
        target: mapElement.current,
        view: new View({
          center: fromLonLat([137.2819151, 34.9796481]),
          zoom: 6,
          minZoom: 5,
          maxZoom: 8,
          extent: transformExtent([122.6094611, 23.4088831, 147.7602811, 46.0830055], 'EPSG:4326', 'EPSG:3857'),
        }),
        controls: [],
      })

      map.current?.addLayer(vectorLayer)

      map.current.on('pointermove', (e) => {
        if (!e.dragging) {
          const features = map.current!.getFeaturesAtPixel(map.current!.getEventPixel(e.originalEvent))
          if (features.length) {
            hoverIds.current = features.map((f) => f.get('id'))
          } else {
            hoverIds.current = []
          }
          map.current!.getTargetElement().style.cursor = features.length ? 'pointer' : '';
          vectorLayer.changed();
        }
      });

      map.current.on('click', (e) => {
        const feature = map.current!.forEachFeatureAtPixel(map.current!.getEventPixel(e.originalEvent), (feature) => feature);
        if (feature) {
          navigate(`/prefecture/${feature.get('id')}`)
        }
      });
    }, [country, darkmode.value, navigate, prefectures]
  )

  if (!country) return;

  return <div className='scrollbar-hide box-border relative' style={{height: 'calc(100dvh - 4rem)'}}>
    <div className='h-[100%] w-[100%]' ref={mapElement}/>

    <Select
      items={countries}
      label={t('map.countries')}
      placeholder={t('map.select_country')}
      selectedKeys={[country.id.toString()]}
      onChange={(e) => {
        if (e.target.value !== '') {
          setCountry(countries.find((c) => c.id.toString() === e.target.value))
        }
      }}
      className='absolute top-4 left-4 w-[20rem]'
    >
      {(c) => <SelectItem key={c.id}>{c.name}</SelectItem>}
    </Select>
  </div>
}
