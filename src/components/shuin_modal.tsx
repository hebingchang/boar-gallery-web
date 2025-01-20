import { Response, Shuin } from "../models/gallery.ts";
import {
  Image,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody, Spacer, Card, CardFooter, Button, Chip
} from "@nextui-org/react";
import { IoCalendarOutline, IoLocationOutline, IoPricetagOutline } from "react-icons/io5";
import moment from "moment";
import useMediaQuery from "../hooks/useMediaQuery.tsx";
import DialogMap from "./dialog_map.tsx";
import { MdOutlineOpenInNew } from "react-icons/md";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";

export interface ShuinModalProps {
  shuin: Shuin
  isOpen: boolean,
  onOpenChange: (isOpen: boolean, path?: string) => void;
}

export default function ShuinModal(props: ShuinModalProps) {
  const isDesktop = useMediaQuery('(min-width: 960px)');
  const { t } = useTranslation()
  const [shuin, setShuin] = useState(props.shuin)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (props.isOpen) {
      setLoading(true)
      setTimeout(() => {
        axios.get<Response<Shuin>>(`https://api.gallery.boar.ac.cn/shuin/get?id=${props.shuin.id}`).then(res => {
          setShuin(res.data.payload)
          setLoading(false)
        })
      }, 100)
    }
  }, [props.isOpen, props.shuin.id])

  // if (!photo.medium_file) return null;
  const isPortrait = shuin.thumb_file.width <= shuin.thumb_file.height;

  const cityLinks = useMemo(() => <div className='flex gap-1'>
    <div color='foreground'
         className="font-bold">{shuin.place.city?.prefecture.name}</div>
    <div color='foreground'
         className="font-bold">{shuin.place.city?.name}</div>
  </div>, [shuin.place.city?.prefecture.name, shuin.place.city?.name])

  const modal = useMemo(() => {
    return <ModalContent className='overflow-hidden'>
      {() => (
        (!isDesktop) || (!isPortrait) ?
          <>
            <ModalHeader className="p-0 flex flex-col gap-1">
              <Card
                isFooterBlurred
                radius="lg"
                className="border-none items-center"
              >
                <Image
                  isBlurred
                  draggable={false}
                  classNames={{
                    img: 'pointer-events-none',
                    blurredImg: 'pointer-events-none'
                  }}
                  className="object-contain"
                  src={shuin.medium_file?.url}
                  width={shuin.medium_file?.width}
                  height={shuin.medium_file?.height}
                  style={{ maxHeight: isDesktop ? 'calc(100dvh - 20rem)' : 'calc(100dvh - 18rem)', height: 'auto' }}
                />
                <CardFooter
                  className="justify-between before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 absolute before:rounded-xl rounded-large bottom-1 shadow-small right-1 z-10 w-auto font-normal">
                  <div
                    className='text-tiny md:text-small text-black/80'>&copy; {moment(shuin.date).year()} {shuin.place.name}</div>
                </CardFooter>
              </Card>
            </ModalHeader>
            <ModalBody className="p-4">
              <div className='flex flex-wrap items-center gap-1'>
                {
                  shuin.place.city ?
                    <div className='flex items-center text-default-500 gap-1'>
                      <IoLocationOutline className='flex-shrink-0' size={20}/>
                      <div className='flex flex-wrap gap-x-3'>
                        {cityLinks}
                        <div className='flex items-center'>
                          <div color='foreground'>{shuin.place.name}</div>
                        </div>
                      </div>
                    </div>
                    :
                    null
                }

                <div className='flex items-center gap-4'>
                  <div className='flex items-center text-small text-default-500 gap-1.5'>
                    <IoCalendarOutline size={18}/>
                    <div>
                      {moment(shuin.date).format('YYYY/M/D')}
                    </div>
                  </div>

                  <div className='flex items-center text-small text-default-500 gap-1.5'>
                    <IoPricetagOutline size={18}/>
                    <div>
                      {shuin.price} {t('shuin.yen')}
                    </div>
                  </div>
                </div>
              </div>

              <div className='py-2 flex space-x-2 text-default-500'>
                <Chip variant="flat">
                  {t(`shuin.type.${shuin.type}`)}
                </Chip>

                {
                  shuin.is_limited ?
                    <Chip color="warning" variant="flat">
                      {t('shuin.is_limited')}
                    </Chip>
                    :
                    null
                }
              </div>

              <div className='gap-4 grid grid-cols-1 md:grid-cols-2'>
                <Card className='overflow-hidden min-h-[109px] md:min-h-0' isFooterBlurred>
                  <DialogMap coordinate={shuin.place.geom}/>
                  <CardFooter
                    className="justify-between before:bg-white/10 border-white/20 border-1 overflow-hidden p-0 absolute before:rounded-xl rounded-large bottom-1 shadow-small right-1 z-10 w-auto font-normal">
                    <Button
                      className="text-tiny text-white bg-black/20"
                      variant="flat"
                      color="default"
                      radius="lg"
                      size="sm"
                      isIconOnly
                      onPress={() => {
                        window.open(`https://maps.google.com/?q=${shuin.place.geom.latitude},${shuin.place.geom.longitude}`)
                      }}
                    >
                      <MdOutlineOpenInNew size={16}/>
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </ModalBody>
          </>
          :
          <>
            <ModalHeader className="p-0 flex flex-col gap-1"/>
            <ModalBody className="p-0 overflow-hidden">
              <div className='flex overflow-hidden'>
                <div className='w-[54%]'>
                  <Card
                    isFooterBlurred
                    radius="lg"
                    className="border-none h-[100%]"
                  >
                    <Image
                      isBlurred
                      classNames={{
                        wrapper: 'h-[100%]',
                        zoomedWrapper: 'h-[100%]',
                        blurredImg: 'h-[100%] pointer-events-none',
                        img: 'pointer-events-none',
                      }}
                      className="object-contain h-[100%]"
                      src={shuin.medium_file?.url}
                      width={shuin.medium_file?.width}
                      height={shuin.medium_file?.height}
                      style={{ height: 'auto', maxHeight: '100%' }}
                    />
                    <CardFooter
                      className="justify-between before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 absolute before:rounded-xl rounded-large bottom-1 shadow-small right-1 z-10 w-auto font-normal">
                      <div
                        className='text-tiny md:text-small text-black/80'>&copy; {moment(shuin.date).year()} {shuin.place.name}</div>
                    </CardFooter>
                  </Card>
                </div>

                <div className='w-[46%] p-6 flex flex-col gap-1 justify-end'>
                  {
                    shuin.place.city ?
                      <div className='flex items-center text-default-500 gap-1'>
                        <IoLocationOutline size={20}/>
                        <div className='flex flex-wrap gap-x-3'>
                          {cityLinks}
                          <div className='flex items-center'>
                            <div color='foreground'>{shuin.place.name}</div>
                          </div>
                        </div>
                      </div>
                      :
                      null
                  }

                  <div className='flex items-center gap-4'>
                    <div className='flex items-center text-default-500 gap-1 text-small'>
                      <IoCalendarOutline size={20}/>
                      {moment(shuin.date).format('YYYY/M/D')}
                    </div>

                    <div className='flex items-center text-default-500 gap-1 text-small'>
                      <IoPricetagOutline size={20}/>
                      {shuin.price} {t('shuin.yen')}
                    </div>
                  </div>

                  <div className='py-2 flex space-x-2 text-default-500'>
                    <Chip variant="flat">
                      {t(`shuin.type.${shuin.type}`)}
                    </Chip>

                    {
                      shuin.is_limited ?
                        <Chip color="warning" variant="flat">
                          {t('shuin.is_limited')}
                        </Chip>
                        :
                        null
                    }
                  </div>

                  <Spacer y={4}/>

                  <div className='gap-4 grid grid-cols-1'>
                    <Card className='overflow-hidden min-h-[256px]' isFooterBlurred>
                      <DialogMap coordinate={shuin.place.geom}/>
                      <CardFooter
                        className="justify-between before:bg-white/10 border-white/20 border-1 overflow-hidden p-0 absolute before:rounded-xl rounded-large bottom-1 shadow-small right-1 z-10 w-auto font-normal">
                        <Button
                          className="text-tiny text-white bg-black/20"
                          variant="flat"
                          color="default"
                          radius="lg"
                          size="sm"
                          isIconOnly
                          onPress={() => {
                            window.open(`https://maps.google.com/?q=${shuin.place.geom.latitude},${shuin.place.geom.longitude}`)
                          }}
                        >
                          <MdOutlineOpenInNew size={16}/>
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                </div>
              </div>
            </ModalBody>
          </>
      )}
    </ModalContent>
  }, [cityLinks, isDesktop, isPortrait, loading, shuin.date, shuin.medium_file?.height, shuin.medium_file?.url, shuin.medium_file?.width, shuin.place.city, shuin.place.geom, shuin.place.name])

  return <Modal
    isOpen={props.isOpen}
    onOpenChange={props.onOpenChange}
    backdrop='blur'
    size='4xl'
    scrollBehavior='inside'
    classNames={{
      closeButton: 'z-20'
    }}
  >
    {modal}
  </Modal>;
}
