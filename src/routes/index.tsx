import { useContext, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Photo, Response } from "../models/gallery.ts";
import { Card, Image, CardFooter, CardBody, useDisclosure } from "@nextui-org/react";
import useMediaQuery from "../hooks/useMediaQuery.tsx";
import PhotoModal from "../components/photo_modal.tsx";
import { LoadingContext } from "../contexts/loading.tsx";
import { useWindowSize } from "@react-hook/window-size";
import {
  useContainerPosition,
  useInfiniteLoader,
  useMasonry,
  usePositioner,
  useScroller
} from "masonic";


export default function Index() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const isDesktop = useMediaQuery('(min-width: 960px)');
  const [loadedIndex, setLoadedIndex] = useState<{ startIndex: number, stopIndex: number }[]>([])

  const containerRef = useRef(null);
  const [windowWidth, height] = useWindowSize();
  const {offset, width} = useContainerPosition(containerRef, [
    windowWidth,
    height
  ]);
  const positioner = usePositioner({
    width,
    columnGutter: isDesktop ? 12 : 8,
    columnCount: isDesktop ? 3 : 2,
  });
  const {scrollTop, isScrolling} = useScroller(offset);

  useEffect(() => {
    axios.get<Response<Photo[]>>('https://api.gallery.boar.ac.cn/photos/all?page_size=20').then(res => {
      setPhotos(res.data.payload)
    })
  }, [])

  const maybeLoadMore = useInfiniteLoader((startIndex, stopIndex, items) => {
    if (loadedIndex.find((e) => e.startIndex === startIndex && e.stopIndex === stopIndex)) {
      return;
    }
    setLoadedIndex((current) => {
      current.push({startIndex, stopIndex})
      return current
    })

    const lastDate = (items[items.length - 1] as Photo).metadata.datetime
    axios.get<Response<Photo[]>>('https://api.gallery.boar.ac.cn/photos/all', {
      params: {
        page_size: stopIndex - startIndex,
        last_datetime: lastDate,
      }
    }).then((res) => {
      if (res.data.payload.length > 0) {
        setPhotos((current) => [...current, ...res.data.payload]);
      }
    })
  }, {
    isItemLoaded: (index, items) => !!items[index],
  });

  return <div className='px-2 pt-[1rem]'>
    {useMasonry({
      positioner,
      scrollTop,
      isScrolling,
      height,
      containerRef,
      items: photos,
      overscanBy: 3,
      onRender: maybeLoadMore,
      render: MasonryCard,
      itemKey: (item) => item.id,
    })}
  </div>
}

const MasonryCard = ({data}: { data: Photo }) => {
  const {isOpen, onOpen, onOpenChange} = useDisclosure();
  const [photo, setPhoto] = useState<Photo>(data);
  const loading = useContext(LoadingContext)
  const isDesktop = useMediaQuery('(min-width: 960px)');

  const openPhotoModel = useMemo(() => () => {
    if (loading && !loading.loading) {
      loading.setLoading(true)
      if (!photo.medium_file) {
        axios.get<Response<Photo>>(`https://api.gallery.boar.ac.cn/photos/get?id=${data.id}`).then(res => {
          setPhoto(res.data.payload)
          history.pushState({}, '', `/photo/${photo.id}`)
          onOpen();
          loading.setLoading(false);
        })
      } else {
        history.pushState({}, '', `/photo/${photo.id}`)
        onOpen();
        loading.setLoading(false)
      }
    }
  }, [data.id, loading, onOpen, photo.id, photo.medium_file])

  return <Card
    radius="lg"
    className="border-none"
    isPressable={isDesktop}
    onPress={isDesktop ? openPhotoModel : undefined}
  >
    <CardBody className="overflow-visible p-0">
      <Image
        className="object-cover"
        src={data.thumb_file.url}
        width={data.thumb_file.width}
        height={data.thumb_file.height}
        onClick={isDesktop ? undefined : openPhotoModel}
      />
    </CardBody>
    {
      data.metadata.city ?
        <CardFooter className="text-small justify-between flex-wrap">
          <b>
            {`${data.metadata.city.prefecture.name} ${data.metadata.city.name}`}
          </b>
          <p className="text-default-500">
            {`${data.metadata.city.prefecture.country.name}`}
          </p>
        </CardFooter>
        :
        null
    }

    <PhotoModal photo={photo} isOpen={isOpen} onOpenChange={(isOpen) => {
      if (!isOpen) {
        history.back()
      }
      onOpenChange()
    }}/>
  </Card>
};
