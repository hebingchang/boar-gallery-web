import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup
} from "react-simple-maps";
import { geoCentroid } from "d3-geo";
import useDarkMode from "use-dark-mode";
import { useState } from "react";
import useMediaQuery from "../hooks/useMediaQuery.tsx";

export default function Map() {
  const darkmode = useDarkMode()
  const [zoom, setZoom] = useState(1)
  const [hoverId, setHoverId] = useState(0)
  const isDesktop = useMediaQuery('(min-width: 960px)');

  return (
    <div className='scrollbar-hide md:pl-[20px] box-content h-[100%] !box-border'>
      <ComposableMap
        projection="geoAzimuthalEqualArea"
        projectionConfig={{
          rotate: [-138, -37, 0],
          scale: isDesktop ? 3600 : 4000
        }}
        className='h-[100%] w-[100%]'
      >
        <ZoomableGroup
          maxZoom={2}
          onMove={({zoom}) => {
            setZoom(zoom)
          }}
          translateExtent={[[-600, -200], [900, 1000]]}
        >
          <Geographies geography='/geojson/JPN.json'>
            {({geographies}) => (
              <>
                {geographies.map(geo => (
                  <Geography
                    key={geo.rsmKey}
                    stroke={darkmode.value ? '#000' : '#FFF'}
                    geography={geo}
                    fill={darkmode.value ? '#222' : '#DDD'}
                    onMouseEnter={() => setHoverId(geo.properties['id'])}
                    onMouseLeave={() => setHoverId(0)}
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
                      <Marker coordinates={centroid}>
                        <text
                          y="2"
                          fontSize={Math.round((isDesktop ? 16 : 24) / zoom)}
                          textAnchor="middle"
                          style={{cursor: 'pointer', userSelect: 'none', transition: 'font-weight .2s ease-out'}}
                          fill={darkmode.value ? '#fff' : '#000'}
                          onClick={() => {
                            console.log(geo)
                          }}
                          fontWeight={hoverId === geo.properties['id'] ? 800 : 400}
                          opacity={0.8}
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
    </div>
  );
}
