import {
  Button, Divider, Dropdown,
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
import { Outlet, useNavigate } from "react-router-dom";
import { LoadingContext } from "../contexts/loading";
import { useEffect, useState } from "react";
import { MapToken, MapTokenContext, MapType } from "../contexts/map_token.tsx";
import axios from "axios";
import { Response } from "../models/gallery.ts";
import { HiOutlineTranslate } from "react-icons/hi";
import { useTranslation } from "react-i18next";
import moment from "moment";
import gradLeft from '../assets/gradients/left.png';
import gradRight from '../assets/gradients/right.png';

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
        // mapbox
        axios.get<Response<string>>('https://api.gallery.boar.ac.cn/mapbox/token').then((res) => {
          setToken({type: MapType.MapBox, token: res.data.payload})
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
  const [token, setToken] = useState<MapToken>()
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const {t, i18n} = useTranslation()
  const navigate = useNavigate();

  return (
    <MapTokenContext.Provider value={{token, setToken}}>
      <LoadingContext.Provider value={{loading, setLoading}}>
        <main
          className={`${darkMode.value ? 'dark' : ''} text-foreground bg-background scrollbar-hide`}>
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
                      size="lg"
                      onPress={() => {
                        navigate(r.route)
                        setIsMenuOpen(false)
                      }}
                      color='foreground'
                    >
                      {r.icon}
                      <Spacer x={2}/>
                      {t(r.text)}
                    </Link>
                  </NavbarMenuItem>
                ))
              }

              <Divider className='mt-4 mb-4'/>

              <div className='text-tiny text-default-400'>
                <p>{t('copyright.reserved', {year: moment().year()})}</p>
                <p className='mt-2'>{t('copyright.description')}</p>
              </div>
            </NavbarMenu>
          </Navbar>

          <div
            className="mx-auto max-w-[1024px] flex"
            style={{minHeight: 'calc(100dvh - 4rem)'}}
          >
            <div className="max-w-64 hidden md:flex flex-col sticky top-[5rem] h-[100%] flex-shrink-0">
              <Listbox>
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

              <Divider className='mt-4 mb-4'/>

              <div className='text-tiny text-default-300 px-4'>
                <p>{t('copyright.reserved', {year: moment().year()})}</p>
                <p className='mt-2'>{t('copyright.description')}</p>
              </div>
            </div>
            <div className='min-w-0' style={{flex: '1 1 auto'}}>
              <Outlet/>
            </div>
          </div>
        </main>

        <div aria-hidden="true" className="fixed hidden dark:md:block dark:opacity-70 -bottom-[40%] -left-[20%] z-0 pointer-events-none">
          <img src={gradLeft}
               className="relative z-10 opacity-0 shadow-black/5 data-[loaded=true]:opacity-100 shadow-none transition-transform-opacity motion-reduce:transition-none !duration-300 rounded-large"
               alt="left background" data-loaded="true"/>
        </div>

        <div aria-hidden="true"
             className="fixed hidden dark:md:block dark:opacity-70 -top-[80%] -right-[60%] 2xl:-top-[60%] 2xl:-right-[45%] z-0 rotate-12 pointer-events-none">
          <img src={gradRight}
               className="relative z-10 opacity-0 shadow-black/5 data-[loaded=true]:opacity-100 shadow-none transition-transform-opacity motion-reduce:transition-none !duration-300 rounded-large"
               alt="right background" data-loaded="true"/>
        </div>
      </LoadingContext.Provider>
    </MapTokenContext.Provider>
  );
}
