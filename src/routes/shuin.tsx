import { useParams } from "react-router-dom";
import { useEffect, useState, cloneElement, MouseEvent } from "react";
import { Shuin, Response } from "../models/gallery.ts";
import axios from "axios";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader, Chip,
  Divider,
  Image,
  Link,
} from "@heroui/react";
import moment from "moment/moment";
import useMediaQuery from "../hooks/useMediaQuery.tsx";
import DialogMap from "../components/dialog_map.tsx";
import { MdOutlineOpenInNew } from "react-icons/md";
import { IoCalendarOutline, IoLocationOutline } from "react-icons/io5";
import { useTranslation } from "react-i18next";
import Zoom from 'react-medium-image-zoom'

export default function ShuinPage() {
  const { id } = useParams()
  const [shuin, setShuin] = useState<Shuin>()
  const isDesktop = useMediaQuery('(min-width: 960px)');
  const { t } = useTranslation()

  useEffect(() => {
    axios.get<Response<Shuin>>('https://api.gallery.boar.ac.cn/shuin/get', {
      params: { id }
    }).then((res) => {
      setShuin(res.data.payload)
    })
  }, [id])

  if (!shuin) return null;

  return (
    <div className='scrollbar-hide px-[10px] md:px-[20px] box-content pt-4 pb-12'>
      <div className='text-5xl mb-8 md:mb-12 ml-2 pt-2'>
        #S{id}
      </div>

      <Card
        isFooterBlurred
        radius="lg"
        className="border-none"
      >
        <Zoom
          ZoomContent={({ buttonUnzoom, img, }) => <>
            {buttonUnzoom}
            {img ? cloneElement(img, {
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-expect-error
              draggable: false,
              onContextMenu: (e: MouseEvent<HTMLImageElement>) => e.preventDefault()
            }) : null}
          </>}
        >
          <Image
            isBlurred
            className={`object-contain ${isDesktop ? 'max-h-128' : ''}`}
            draggable={false}
            classNames={{
              // img: 'pointer-events-none',
              // blurredImg: 'pointer-events-none'
            }}
            onContextMenu={(e) => e.preventDefault()}
            src={shuin.large_file!.url}
            width={shuin.large_file!.width}
            height={shuin.large_file!.height}
            style={{ height: 'auto' }}
          />
        </Zoom>
        <CardFooter
          className="justify-between before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 absolute before:rounded-xl rounded-large bottom-1 shadow-small right-1 z-10 w-auto font-normal">
          <div
            className='text-tiny md:text-small text-white/80'>&copy; {moment(shuin.date).year()} {shuin.place.name}</div>
        </CardFooter>
      </Card>

      <div className='gap-4 grid grid-cols-1 md:grid-cols-2 mt-4 pb-4'>
        <div>
          <Card>
            <CardBody>
              <div className='flex flex-col gap-1'>
                {
                  shuin.place.city ?
                    <div className='flex items-center text-default-500 gap-2'>
                      <IoLocationOutline className='shrink-0' size={20}/>
                      <div className='flex flex-wrap gap-x-3'>
                        <div className='flex gap-1'>
                          <div color='foreground'
                               className="font-bold">{shuin.place.city?.prefecture.name}</div>
                          <div color='foreground'
                               className="font-bold">{shuin.place.city?.name}</div>
                        </div>
                        <div className='flex items-center'>
                          <Link color='foreground'>{shuin.place.name}</Link>
                        </div>
                      </div>
                    </div>
                    :
                    null
                }

                <div className='flex items-center text-default-500 gap-2'>
                  <IoCalendarOutline size={20}/>
                  <div>
                    {moment(shuin.date).format('YYYY/MM')}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className='overflow-visible mt-4'>
            <CardHeader className='text-small font-semibold bg-default-100 py-2'>
              <div>{t('shuin.basic_information')}</div>
            </CardHeader>
            <CardBody className='text-small text-default-500 py-2 overflow-y-visible'>
              <div><b>{t('shuin.price')}：</b>{shuin.price} {t('shuin.yen')}</div>
            </CardBody>
            <Divider className='bg-default-100'/>
            <CardFooter className='py-2 flex space-x-2 text-default-500'>
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
            </CardFooter>
          </Card>
        </div>

        <Card className='overflow-hidden min-h-[200px] md:min-h-0' isFooterBlurred>
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
  );
}
