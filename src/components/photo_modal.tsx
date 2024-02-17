import { Photo } from "../models/gallery.ts";
import {
  Image,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody, Link, Spacer
} from "@nextui-org/react";
import { IoCalendarOutline, IoLocationOutline } from "react-icons/io5";
import moment from "moment";
import { RiCameraLensLine, RiCameraLine } from "react-icons/ri";
import useMediaQuery from "../hooks/useMediaQuery.tsx";

export interface PhotoModalProps {
  photo: Photo
  isOpen: boolean,
  onOpenChange: (isOpen: boolean) => void;
}

export default function PhotoModal(props: PhotoModalProps) {
  const photo = props.photo;
  const isDesktop = useMediaQuery('(min-width: 960px)');
  if (!photo.medium_file) return null;

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
      <ModalContent>
        {() => (
          (!isDesktop) || (photo.medium_file!.width > photo.medium_file!.height) ?
            <>
              <ModalHeader className="p-0 flex flex-col gap-1">
                <Image
                  className="object-cover"
                  src={photo.medium_file!.url}
                  width={photo.medium_file!.width}
                  height={photo.medium_file!.height}
                />
              </ModalHeader>
              <ModalBody className="py-4">
                <div className='flex flex-wrap items-center justify-between'>
                  <div className='flex items-center text-default-500 gap-1'>
                    <IoLocationOutline size={20}/>
                    <div className='flex gap-1'>
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

                  <div className='flex items-center text-default-500 gap-1.5'>
                    <IoCalendarOutline size={18}/>
                    <div>
                      {moment(photo.metadata.datetime).utcOffset(`+${photo.metadata.timezone.split('+')[1]}`).format('YYYY-MM-DD HH:mm (Z)')}
                    </div>
                  </div>
                </div>

                <div className='flex flex-wrap items-center justify-between'>
                  <div className='flex items-center text-default-500 gap-1'>
                    <RiCameraLine size={20}/>
                    <code>
                      {photo.metadata.camera.manufacture.name} {photo.metadata.camera.model}
                    </code>
                  </div>

                  <div className='flex items-center text-default-500 gap-1 overflow-hidden'>
                    <RiCameraLensLine size={20} className='w-[20px]'/>
                    <code className='flex-1'>
                      {photo.metadata.lens.manufacture.name} {photo.metadata.lens.model}
                    </code>
                  </div>

                  <div className="flex h-5 items-center space-x-4 text-small">
                    <code>ISO{photo.metadata.photographic_sensitivity} |
                      ƒ/{photo.metadata.f_number} | {photo.metadata.exposure_time_rat}s
                      | {photo.metadata.focal_length}mm</code>
                  </div>
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
              <ModalBody className="p-0">
                <div className='flex flex-wrap'>
                  <div className='flex-1'>
                    <Image
                      className="object-cover"
                      src={photo.medium_file!.url}
                      width={photo.medium_file!.width}
                      height={photo.medium_file!.height}
                    />
                  </div>

                  <div className='flex-1 p-6 flex flex-col gap-1 justify-end'>
                    <div className='flex items-center text-default-500 gap-1'>
                      <IoLocationOutline size={20}/>
                      <div className='flex gap-1'>
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

                    <div className='flex items-center text-default-500 gap-1'>
                      <IoCalendarOutline size={20}/>
                      <code>
                        {moment(photo.metadata.datetime).utcOffset(`+${photo.metadata.timezone.split('+')[1]}`).format('YYYY-MM-DD HH:mm (Z)')}
                      </code>
                    </div>

                    <Spacer y={1}/>

                    <div className='flex items-center text-default-500 gap-1'>
                      <RiCameraLine size={20}/>
                      <code>
                        {photo.metadata.camera.manufacture.name} {photo.metadata.camera.model}
                      </code>
                    </div>

                    <div className='flex items-center text-default-500 gap-1 overflow-hidden'>
                      <RiCameraLensLine size={20} className='w-[20px]'/>
                      <code className='flex-1'>
                        {photo.metadata.lens.manufacture.name} {photo.metadata.lens.model}
                      </code>
                    </div>

                    <div className="flex h-5 items-center space-x-4 text-small">
                      <code>ISO{photo.metadata.photographic_sensitivity} |
                        ƒ/{photo.metadata.f_number} | {photo.metadata.exposure_time_rat}s
                        | {photo.metadata.focal_length}mm</code>
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
