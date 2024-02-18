import { Photo } from "../models/gallery.ts";
import {
  Image,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody, Link, Spacer, Card, CardFooter, CardHeader, CardBody, Divider, Button
} from "@nextui-org/react";
import { IoCalendarOutline, IoLocationOutline } from "react-icons/io5";
import moment from "moment";
import useMediaQuery from "../hooks/useMediaQuery.tsx";
import ManufactureIcon from "./manufacture_icon.tsx";
import DialogMap from "./dialog_map.tsx";
import { MdOutlineOpenInNew } from "react-icons/md";

export interface PhotoModalProps {
  photo: Photo
  isOpen: boolean,
  onOpenChange: (isOpen: boolean) => void;
}

export default function PhotoModal(props: PhotoModalProps) {
  const photo = props.photo;
  const isDesktop = useMediaQuery('(min-width: 960px)');
  if (!photo.medium_file) return null;

  const isPortrait = photo.medium_file!.width <= photo.medium_file!.height;

  return (
    <Modal
      isOpen={props.isOpen}
      onOpenChange={props.onOpenChange}
      backdrop='blur'
      size='4xl'
      scrollBehavior='inside'
      classNames={{
        closeButton: 'z-20'
      }}
      motionProps={{
        variants: {
          enter: {
            transform: "scale(1)",
            opacity: 1,
            transition: {
              duration: 0.2,
              ease: [0, 0, 0.2, 1],
            },
          },
          exit: {
            transform: "scale(1.03)",
            opacity: 0,
            transition: {
              duration: 0.1,
              ease: [0.4, 0, 1, 1],
            },
          },
        }
      }}>
      <ModalContent className='overflow-hidden'>
        {() => (
          (!isDesktop) || (!isPortrait) ?
            <>
              <ModalHeader className="p-0 flex flex-col gap-1">
                <Card
                  isFooterBlurred
                  radius="lg"
                  className="border-none"
                >
                  <Image
                    isBlurred
                    className="object-contain"
                    src={photo.medium_file!.url}
                    width={photo.medium_file!.width}
                    height={photo.medium_file!.height}
                    style={isDesktop ? {maxHeight: 'calc(100dvh - 20rem)'} : {maxHeight: 'calc(100dvh - 18rem)'}}
                  />
                  <CardFooter
                    className="justify-between before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 absolute before:rounded-xl rounded-large bottom-1 shadow-small right-1 z-10 w-auto font-normal">
                    <div
                      className='text-tiny md:text-small text-white/80'>&copy; {moment(photo.metadata.datetime).year()} {photo.author.name}</div>
                  </CardFooter>
                </Card>
              </ModalHeader>
              <ModalBody className="p-4">
                <div className='flex flex-wrap items-center justify-between'>
                  {
                    photo.metadata.city ?
                      <div className='flex items-center text-default-500 gap-1'>
                        <IoLocationOutline className='flex-shrink-0' size={20}/>
                        <div className='flex flex-wrap gap-x-3'>
                          <div className='flex gap-1'>
                            <Link color='foreground'
                                  className="font-bold">{photo.metadata.city.prefecture.country.name}</Link>
                            <Link color='foreground' className="font-bold">{photo.metadata.city.prefecture.name}</Link>
                            <Link color='foreground' className="font-bold">{photo.metadata.city.name}</Link>
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

                  <div className='flex items-center text-small text-default-500 gap-1.5'>
                    <IoCalendarOutline size={18}/>
                    <div>
                      {moment(photo.metadata.datetime).utcOffset(`+${photo.metadata.timezone.split('+')[1]}`).format('YYYY-MM-DD HH:mm (Z)')}
                    </div>
                  </div>
                </div>

                <div className='gap-4 grid grid-cols-1 md:grid-cols-2'>
                  <Card className='overflow-visible'>
                    <CardHeader className='text-small font-semibold bg-default-100 py-2'>
                      <ManufactureIcon name={photo.metadata.camera.manufacture.name}/> {photo.metadata.camera.model}
                    </CardHeader>
                    <CardBody className='text-small text-default-500 py-2 overflow-y-visible'>
                      {photo.metadata.lens.manufacture.name} {photo.metadata.lens.model}
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

                  {
                    photo.metadata.location &&
                    <Card className='overflow-hidden min-h-[109px] md:min-h-0' isFooterBlurred>
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
              </ModalBody>
              {/*<ModalFooter>*/}
              {/*  <Button color="danger" variant="light" onPress={onClose}>*/}
              {/*    Close*/}
              {/*  </Button>*/}
              {/*  <Button color="primary" onPress={onClose}>*/}
              {/*  Action*/}
              {/*  </Button>*/}
              {/*</ModalFooter>*/}
            </>
            :
            <>
              <ModalHeader className="p-0 flex flex-col gap-1"/>
              <ModalBody className="p-0 overflow-hidden">
                <div className='grid grid-cols-12'>
                  <div className='col-span-7'>
                    <Card
                      isFooterBlurred
                      radius="lg"
                      className="border-none"
                    >
                      <Image
                        isBlurred
                        className="object-contain"
                        src={photo.medium_file!.url}
                        width={photo.medium_file!.width}
                        height={photo.medium_file!.height}
                      />
                      <CardFooter
                        className="justify-between before:bg-white/10 border-white/20 border-1 overflow-hidden py-1 absolute before:rounded-xl rounded-large bottom-1 shadow-small right-1 z-10 w-auto font-normal">
                        <div
                          className='text-tiny md:text-small text-white/80'>&copy; {moment(photo.metadata.datetime).year()} {photo.author.name}</div>
                      </CardFooter>
                    </Card>
                  </div>

                  <div className='col-span-5 p-6 flex flex-col gap-1 justify-end'>
                    {
                      photo.metadata.city ?
                        <div className='flex items-center text-default-500 gap-1'>
                          <IoLocationOutline size={20}/>
                          <div className='flex gap-1 flex-wrap'>
                            <Link color='foreground'
                                  className="font-bold">{photo.metadata.city.prefecture.country.name}</Link>
                            <Link color='foreground' className="font-bold">{photo.metadata.city.prefecture.name}</Link>
                            <Link color='foreground' className="font-bold">{photo.metadata.city.name}</Link>
                            {
                              photo.metadata.place ?
                                <div className='flex items-center'>
                                  <Spacer x={2}/>
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

                    <div className='flex items-center text-default-500 gap-1 text-small'>
                      <IoCalendarOutline size={20}/>
                      {moment(photo.metadata.datetime).utcOffset(`+${photo.metadata.timezone.split('+')[1]}`).format('YYYY-MM-DD HH:mm (Z)')}
                    </div>

                    <Spacer y={4}/>

                    <div className='gap-4 grid grid-cols-1'>
                      <Card className='overflow-visible'>
                        <CardHeader className='text-small font-semibold bg-default-100 py-2'>
                          <ManufactureIcon name={photo.metadata.camera.manufacture.name}/> {photo.metadata.camera.model}
                        </CardHeader>
                        <CardBody className='text-small text-default-500 py-2 overflow-y-visible'>
                          {photo.metadata.lens.manufacture.name} {photo.metadata.lens.model}
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

                      {
                        photo.metadata.location && <Card className='overflow-hidden min-h-[256px]' isFooterBlurred>
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
                </div>
              </ModalBody>
            </>
        )}
      </ModalContent>
    </Modal>
  );
}
