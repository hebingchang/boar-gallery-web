import {
  Button, Dropdown,
  DropdownItem, DropdownMenu, DropdownTrigger,
  Listbox,
  ListboxItem,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem
} from "@nextui-org/react";
import useDarkMode from "use-dark-mode";
import { TbHome, TbMap, TbMoon, TbSun } from "react-icons/tb";
import { Outlet } from "react-router-dom";
import { LoadingContext } from "../contexts/loading";
import { useEffect, useState } from "react";
import { MapToken, MapTokenContext, MapType } from "../contexts/map_token.tsx";
import axios from "axios";
import { Response } from "../models/gallery.ts";
import { HiOutlineTranslate } from "react-icons/hi";
import { useTranslation } from "react-i18next";

export default function Root() {
  const darkMode = useDarkMode(false, {
    classNameDark: 'dark',
    classNameLight: 'light',
    element: document.documentElement,
  });

  useEffect(() => {
    axios.get<Response<string>>('https://api.gallery.boar.ac.cn/geo/ip').then(async (res) => {
      if (res.data.payload === 'CN') {
        // baidu map
        axios.get<Response<string>>('https://api.gallery.boar.ac.cn/baidu-map/token').then((res) => {
          setToken({type: MapType.Baidu, token: res.data.payload})
        })
      } else {
        // apple map
        axios.get<Response<string>>('https://api.gallery.boar.ac.cn/mapkit-js/token').then((res) => {
          setToken({type: MapType.Apple, token: res.data.payload})
        })
      }
    })
  }, [])

  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState<MapToken>({type: MapType.Apple, token: ''})
  const {t, i18n} = useTranslation()

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
                <Dropdown>
                  <DropdownTrigger>
                    <Button isIconOnly variant="bordered">
                      <HiOutlineTranslate size={20}/>
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="Single selection example"
                    variant="flat"
                    disallowEmptySelection
                    selectionMode="single"
                    selectedKeys={[i18n.language]}
                    onSelectionChange={(l) => i18n.changeLanguage((l as Set<string>).values().next().value)}
                  >
                    <DropdownItem key="zh-CN">简体中文</DropdownItem>
                    <DropdownItem key="en">English</DropdownItem>
                    <DropdownItem key="ja">日本語</DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </NavbarItem>
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
              <Listbox className="max-w-64 hidden md:flex sticky top-0 pt-[5rem]">
                <ListboxItem
                  key="home"
                  href="/"
                  className="px-4 py-3"
                  variant="flat"
                  startContent={<TbHome size={22}/>}
                >
                  <p className="text-medium font-bold">{t('sidebar.home')}</p>
                </ListboxItem>
                <ListboxItem
                  key="map"
                  href="/map"
                  className="px-4 py-3"
                  variant="flat"
                  startContent={<TbMap size={22}/>}
                >
                  <p className="text-medium font-bold">{t('sidebar.map')}</p>
                </ListboxItem>
              </Listbox>

              <div className='w-full'>
                <Outlet/>
              </div>
            </div>
          </div>
        </main>
      </LoadingContext.Provider>
    </MapTokenContext.Provider>
  );
}
