import {
  Button, Dropdown,
  DropdownItem, DropdownMenu, DropdownTrigger, Link,
  Listbox,
  ListboxItem,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem, NavbarMenu, NavbarMenuItem, NavbarMenuToggle, Spacer
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

const routes = [
  {route: '/', text: 'sidebar.home', icon: <TbHome size={22}/>},
  {route: '/map', text: 'sidebar.map', icon: <TbMap size={22}/>},
]

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const {t, i18n} = useTranslation()

  return (
    <MapTokenContext.Provider value={{token, setToken}}>
      <LoadingContext.Provider value={{loading, setLoading}}>
        <main
          className={`${darkMode.value ? 'dark' : ''} text-foreground bg-background overflow-y-scroll scrollbar-hide`}>
          <Navbar onMenuOpenChange={setIsMenuOpen} isMenuOpen={isMenuOpen}>
            <NavbarBrand>
              <Link className="font-bold text-inherit text-logo" href='/'>Boar Gallery</Link>
            </NavbarBrand>
            <NavbarContent justify="end">
              <NavbarItem className={`${isMenuOpen ? '' : 'hidden'} sm:flex`}>
                <Dropdown>
                  <DropdownTrigger>
                    <Button isIconOnly variant="light">
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
              <NavbarItem className={`${isMenuOpen ? '' : 'hidden'} sm:flex`}>
                <Button isIconOnly variant="flat" onClick={darkMode.toggle}>
                  {
                    darkMode.value ?
                      <TbSun size={24}/>
                      :
                      <TbMoon size={20}/>
                  }
                </Button>
              </NavbarItem>
              <NavbarMenuToggle className="sm:hidden ml-2"/>
            </NavbarContent>

            <NavbarMenu>
              {
                routes.map((r) => (
                  <NavbarMenuItem key={r.route}>
                    <Link
                      className="w-full pt-3 font-bold"
                      href={r.route}
                      size="lg"
                      onPress={() => setIsMenuOpen(false)}
                      color='foreground'
                    >
                      {r.icon}
                      <Spacer x={2}/>
                      {t(r.text)}
                    </Link>
                  </NavbarMenuItem>
                ))
              }
            </NavbarMenu>
          </Navbar>

          <div className="top-0 left-0 right-0 bottom-0 absolute">
            <div
              className="container mx-auto max-w-[1024px] flex flex-row flex-1 overflow-y-auto scrollbar-hide"
              style={{height: '100%'}}
            >
              <Listbox className="max-w-64 hidden md:flex sticky top-0 pt-[5rem]">
                {
                  routes.map((r) => (
                    <ListboxItem
                      key={r.route}
                      href={r.route}
                      className="px-4 py-3"
                      variant="flat"
                      startContent={r.icon}
                    >
                      <p className="text-medium font-bold">{t(r.text)}</p>
                    </ListboxItem>
                  ))
                }
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
