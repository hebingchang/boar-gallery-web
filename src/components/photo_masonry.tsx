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


export default function PhotoMasonry(props: { prefectureId?: string, cityId?: string }) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const isDesktop = useMediaQuery('(min-width: 960px)');
  const loadedIndex = useRef<{ startIndex: number, stopIndex: number }[]>([]);

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
  const query = useMemo(() => ({
    prefecture_id: props.prefectureId && props.prefectureId !== '0' ? props.prefectureId : undefined,
    city_id: props.cityId && props.cityId !== '0' ? props.cityId : undefined,
  }), [props.cityId, props.prefectureId])

  useEffect(() => {
    axios.get<Response<Photo[]>>('https://api.gallery.boar.ac.cn/photos/all', {
      params: {
        ...query,
        page_size: 20
      }
    }).then(res => {
      setPhotos(res.data.payload)
    })
  }, [query])

  const maybeLoadMore = useInfiniteLoader((startIndex, stopIndex, items) => {
    if (loadedIndex.current.find((e) => e.startIndex === startIndex && e.stopIndex === stopIndex)) {
      return;
    }
    loadedIndex.current.push({startIndex, stopIndex})

    const lastDate = (items[items.length - 1] as Photo).metadata.datetime
    axios.get<Response<Photo[]>>('https://api.gallery.boar.ac.cn/photos/all', {
      params: {
        ...query,
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

  return useMasonry({
    positioner,
    scrollTop,
    isScrolling,
    height,
    containerRef,
    items: photos,
    overscanBy: 3,
    itemHeightEstimate: 0,
    onRender: maybeLoadMore,
    render: MasonryCard,
    itemKey: (item) => item.id,
  })
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
        draggable={false}
        classNames={{
          img: 'pointer-events-none',
          blurredImg: 'pointer-events-none'
        }}
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
