import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Photo, Response } from "../models/gallery.ts";
import axios from "axios";
import { Button, Card, CardBody, CardFooter, CardHeader, Divider, Image, Link } from "@nextui-org/react";
import moment from "moment/moment";
import useMediaQuery from "../hooks/useMediaQuery.tsx";
import ManufactureIcon from "../components/manufacture_icon.tsx";
import DialogMap from "../components/dialog_map.tsx";
import { MdOutlineOpenInNew } from "react-icons/md";
import { IoCalendarOutline, IoLocationOutline } from "react-icons/io5";
import { PiMountains } from "react-icons/pi";
import { useTranslation } from "react-i18next";
import CameraName from "../components/camera_name.tsx";

export default function PhotoPage() {
  const {id} = useParams()
  const [photo, setPhoto] = useState<Photo>()
  const isDesktop = useMediaQuery('(min-width: 960px)');
  const {t} = useTranslation()

  useEffect(() => {
    axios.get<Response<Photo>>('https://api.gallery.boar.ac.cn/photos/get', {
      params: {id}
    }).then((res) => {
      setPhoto(res.data.payload)
    })
  }, [id])

  if (!photo) return null;

  return (
    <div className='scrollbar-hide px-[10px] md:px-[20px] box-content pt-4 pb-12'>
      <div className='text-5xl mb-8 md:mb-12 ml-2 pt-2'>
        #{id}
      </div>

      <Card
        isFooterBlurred
        radius="lg"
        className="border-none"
      >
        <Image
          isBlurred
          className={`object-contain ${isDesktop ? 'max-h-[32rem]' : ''}`}
          draggable={false}
          classNames={{
            img: 'pointer-events-none',
            blurredImg: 'pointer-events-none'
          }}
          src={photo.large_file!.url}
          width={photo.large_file!.width}
          height={photo.large_file!.height}
        />
        <CardFooter
          className="justify-between before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 absolute before:rounded-xl rounded-large bottom-1 shadow-small right-1 z-10 w-auto font-normal">
          <div
            className='text-tiny md:text-small text-white/80'>&copy; {moment(photo.metadata.datetime).year()} {photo.author?.name}</div>
        </CardFooter>
      </Card>

      <div className='gap-4 grid grid-cols-1 md:grid-cols-2 mt-4 pb-4'>
        <div>
          <Card>
            <CardBody>
              <div className='flex flex-col gap-1'>
                {
                  photo.metadata.city ?
                    <div className='flex items-center text-default-500 gap-2'>
                      <IoLocationOutline className='flex-shrink-0' size={20}/>
                      <div className='flex flex-wrap gap-x-3'>
                        <div className='flex gap-1'>
                          <Link color='foreground'
                                className="font-bold">{photo.metadata.city.prefecture.country.name}</Link>
                          <Link color='foreground' className="font-bold"
                                href={`/prefecture/${photo.metadata.city.prefecture.id}`}>{photo.metadata.city.prefecture.name}</Link>
                          <Link color='foreground' className="font-bold"
                                href={`/prefecture/${photo.metadata.city.prefecture.id}/city/${photo.metadata.city.id}`}>{photo.metadata.city.name}</Link>
                        </div>
                        {
                          photo.metadata.place ?
                            <div className='flex items-center'>
                              <Link color='foreground'>{photo.metadata.place.name}</Link>
                            </div>
                            :
                            null
                        }
                      </div>
                    </div>
                    :
                    null
                }

                <div className='flex items-center text-default-500 gap-2'>
                  <IoCalendarOutline size={20}/>
                  <div>
                    {moment(photo.metadata.datetime).utcOffset(`+${photo.metadata.timezone.split('+')[1]}`).format('YYYY-MM-DD HH:mm ([GMT]Z)')}
                  </div>
                </div>

                {
                  photo.metadata.altitude ?
                    <div className='flex items-center text-default-500 gap-2'>
                      <PiMountains size={20}/>
                      <div>
                        {parseFloat(photo.metadata.altitude.toFixed(2))}m
                      </div>
                    </div>
                    :
                    null
                }
              </div>
            </CardBody>
          </Card>

          <Card className='overflow-visible mt-4'>
            <CardHeader className='text-small font-semibold bg-default-100 py-2'>
              <ManufactureIcon name={photo.metadata.camera?.manufacture.name}/>
              <CameraName camera={photo.metadata.camera}/>
            </CardHeader>
            <CardBody className='text-small text-default-500 py-2 overflow-y-visible'>
              {photo.metadata.lens ?
                `${photo.metadata.lens.manufacture.name} ${photo.metadata.lens.model}`
                :
                t('unknown_lens')
              }
            </CardBody>
            <Divider className='bg-default-100'/>
            <CardFooter className='py-2 flex justify-around text-default-500'>
              <code className='text-small'>ISO {photo.metadata.photographic_sensitivity}</code>
              <code className='text-small text-default-300 font-extralight'>|</code>
              <code className='text-small'>ƒ{photo.metadata.f_number}</code>
              <code className='text-small text-default-300 font-extralight'>|</code>
              <code className='text-small'>{photo.metadata.exposure_time_rat} s</code>
              <code className='text-small text-default-300 font-extralight'>|</code>
              <code className='text-small'>{photo.metadata.focal_length} mm</code>
            </CardFooter>
          </Card>
        </div>

        {
          photo.metadata.location &&
          <Card className='overflow-hidden min-h-[200px] md:min-h-0' isFooterBlurred>
            <DialogMap coordinate={photo.metadata.location}/>
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
                  window.open(`https://maps.google.com/?q=${photo.metadata.location!.latitude},${photo.metadata.location!.longitude}`)
                }}
              >
                <MdOutlineOpenInNew size={16}/>
              </Button>
            </CardFooter>
          </Card>
        }
      </div>
    </div>
  );
}
