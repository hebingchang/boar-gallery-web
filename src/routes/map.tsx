import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup
} from "react-simple-maps";
import { geoCentroid } from "d3-geo";
import useDarkMode from "use-dark-mode";
import { useEffect, useState } from "react";
import useMediaQuery from "../hooks/useMediaQuery.tsx";
import { Select, SelectItem } from "@nextui-org/react";
import { Country, Prefecture, Response } from "../models/gallery.ts";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

export default function Map() {
  const darkmode = useDarkMode()
  const [zoom, setZoom] = useState(1)
  const [hoverId, setHoverId] = useState(0)
  const isDesktop = useMediaQuery('(min-width: 960px)');
  const [countries, setCountries] = useState<Country[]>([])
  const [country, setCountry] = useState<Country>()
  const [prefectures, setPrefectures] = useState<Prefecture[]>([])
  const {t} = useTranslation()
  const navigate = useNavigate();

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

  if (!country) return;

  return (
    <div className='scrollbar-hide box-border relative' style={{height: 'calc(100dvh - 4rem)'}}>
      <ComposableMap
        projection="geoAzimuthalEqualArea"
        projectionConfig={{
          rotate: country.rotate,
          scale: isDesktop ? country.scale[0] : country.scale[1]
        }}
        className='h-[100%] w-[100%]'
      >
        <ZoomableGroup
          maxZoom={isDesktop ? country.max_zoom[0] : country.max_zoom[1]}
          onMove={({zoom}) => {
            setZoom(zoom)
          }}
          translateExtent={[[country.translate_extent[0], country.translate_extent[1]], [country.translate_extent[2], country.translate_extent[3]]]}
        >
          <Geographies geography={`/geojson/${country.code}.json`}>
            {({geographies}) => (
              <>
                {geographies.map(geo => (
                  <Geography
                    key={geo.rsmKey}
                    stroke={darkmode.value ? '#000' : '#FFF'}
                    geography={geo}
                    fill={
                      darkmode.value ?
                        (prefectures.find((p) => p.id === geo.properties['id'])?.photos_count ?? 0) > 0 ? '#792A4C' : '#222'
                        :
                        (prefectures.find((p) => p.id === geo.properties['id'])?.photos_count ?? 0) > 0 ? '#FEDFE1' : '#DDD'
                    }
                    onMouseEnter={() => setHoverId(geo.properties['id'])}
                    onMouseLeave={() => setHoverId(0)}
                    onClick={() => navigate(`/prefecture/${geo.properties['id']}`)}
                    style={{
                      default: {
                        cursor: 'pointer',
                        transition: 'opacity .2s ease-out',
                        outline: 'none',
                      },
                      hover: {
                        cursor: 'pointer',
                        boxShadow: '10px 15px 7px #c7c7c7',
                        opacity: 0.8,
                        transition: 'opacity .2s ease-out',
                        outline: 'none',
                      },
                      pressed: {
                        cursor: 'pointer',
                        outline: 'none',
                      },
                    }}
                  />
                ))}

                {geographies.map(geo => {
                  const centroid = geoCentroid(geo);
                  return (
                    <g key={geo.rsmKey + "-name"}>
                      <Marker
                        coordinates={centroid}
                      >
                        <text
                          y="2"
                          fontSize={Math.round((isDesktop ? 16 : 24) / zoom)}
                          textAnchor="middle"
                          style={{cursor: 'pointer', userSelect: 'none', transition: 'font-weight .2s ease-out'}}
                          fill={darkmode.value ? '#fff' : '#000'}
                          onClick={() => navigate(`/prefecture/${geo.properties['id']}`)}
                          fontWeight={hoverId === geo.properties['id'] ? 800 : 400}
                          opacity={0.8}
                          onMouseEnter={() => setHoverId(geo.properties['id'])}
                          onMouseLeave={() => setHoverId(0)}
                        >
                          {geo.properties['name']}
                        </text>
                      </Marker>
                    </g>
                  );
                })}
              </>
            )}
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

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
        className='absolute bottom-4 left-4 w-[20rem]'
      >
        {(c) => <SelectItem key={c.id}>{c.name}</SelectItem>}
      </Select>
    </div>
  );
}
