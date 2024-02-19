import { useContext, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Photo, Response } from "../models/gallery.ts";
import { Card, Image, CardFooter, CardBody, useDisclosure } from "@nextui-org/react";
import useMediaQuery from "../hooks/useMediaQuery.tsx";
import PhotoModal from "../components/photo_modal.tsx";
import { LoadingContext } from "../contexts/loading.tsx";
import {
  useInfiniteLoader,
  useMasonry,
  usePositioner,
  useResizeObserver
} from "masonic";
import { useSize, useScroller } from "mini-virtual-list";


export default function Index() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const isDesktop = useMediaQuery('(min-width: 960px)');
  const containerRef = useRef(null);
  const {width, height} = useSize(containerRef);
  const {scrollTop, isScrolling} = useScroller(containerRef);
  const [loadedIndex, setLoadedIndex] = useState<{ startIndex: number, stopIndex: number }[]>([])
  const positioner = usePositioner({
    width: width - (isDesktop ? 40 : 20),
    columnCount: isDesktop ? 3 : 2,
    columnGutter: isDesktop ? 16 : 8,
  });
  const resizeObserver = useResizeObserver(positioner);

  useEffect(() => {
    axios.get<Response<Photo[]>>('https://api.gallery.boar.ac.cn/photos/all?page_size=60').then(res => {
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

  return (
    <div className='h-[100%] overflow-scroll scrollbar-hide px-[10px] md:px-[20px] box-content' ref={containerRef}>
      {useMasonry({
        positioner,
        scrollTop,
        isScrolling,
        height,
        resizeObserver,
        items: photos,
        overscanBy: 2,
        render: MasonryCard,
        className: 'mt-[5rem]',
        onRender: maybeLoadMore,
      })}
    </div>
  );
}

const MasonryCard = ({data}: { data: Photo }) => {
  const {isOpen, onOpen, onOpenChange} = useDisclosure();
  const [photo, setPhoto] = useState<Photo>(data);
  const loading = useContext(LoadingContext)

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
    isPressable
    onPress={openPhotoModel}
  >
    <CardBody className="overflow-visible p-0">
      <Image
        className="object-cover"
        src={data.thumb_file.url}
        width={data.thumb_file.width}
        height={data.thumb_file.height}
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
