import {
  Button,
  Listbox,
  ListboxItem,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem, Spacer
} from "@nextui-org/react";
import useDarkMode from "use-dark-mode";
import { TbSun, TbMoon, TbHome, TbMap } from "react-icons/tb";
import { Outlet } from "react-router-dom";
import { LoadingContext } from "../contexts/loading";
import { useEffect, useState } from "react";
import { MapTokenContext } from "../contexts/map_token.tsx";
import axios from "axios";
import { Response } from "../models/gallery.ts";

export default function Root() {
  const darkMode = useDarkMode(false, {
    classNameDark: 'dark',
    classNameLight: 'light',
    element: document.documentElement,
  });

  useEffect(() => {
    axios.get<Response<string>>('https://api.gallery.boar.ac.cn/mapkit-js/token').then((res) => {
      setToken(res.data.payload)
    })
  }, [])

  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState('')

  return (
    <MapTokenContext.Provider value={{token, setToken}}>
      <LoadingContext.Provider value={{loading, setLoading}}>
        <main
          className={`${darkMode.value ? 'dark' : ''} text-foreground bg-background overflow-y-scroll scrollbar-hide`}>
          <Navbar>
            <NavbarBrand>
              <p className="font-bold text-inherit text-logo">Boar Gallery</p>
            </NavbarBrand>
            <NavbarContent justify="end">
              <NavbarItem>
                <Button isIconOnly variant="flat" onClick={darkMode.toggle}>
                  {
                    darkMode.value ?
                      <TbSun size={24}/>
                      :
                      <TbMoon size={20}/>
                  }
                </Button>
              </NavbarItem>
            </NavbarContent>
          </Navbar>

          <div className="top-0 left-0 right-0 bottom-0 absolute">
            <div
              className="container mx-auto max-w-[1024px] flex flex-row flex-1 overflow-y-auto scrollbar-hide"
              style={{height: '100%'}}
            >
              <Listbox className="max-w-64 hidden md:flex sticky top-0 pt-[4rem]">
                <ListboxItem
                  key="home"
                  // href="/home"
                  className="px-4 py-3"
                  variant="flat"
                  startContent={<TbHome size={22}/>}
                >
                  <p className="text-medium">Home</p>
                </ListboxItem>
                <ListboxItem
                  key="map"
                  // href="/map"
                  className="px-4 py-3"
                  variant="flat"
                  startContent={<TbMap size={22}/>}
                >
                  <p className="text-medium">Map</p>
                </ListboxItem>
              </Listbox>

              <Spacer x={4} className='hidden md:block'/>

              <div className='w-full px-2'>
                <Outlet/>
              </div>

              <Spacer x={4} className='hidden md:block'/>
            </div>
          </div>
        </main>
      </LoadingContext.Provider>
    </MapTokenContext.Provider>
  );
}
