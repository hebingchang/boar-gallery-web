import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Response, Shuin } from "../models/gallery.ts";
import { Card, Image, CardFooter, CardBody, useDisclosure } from "@nextui-org/react";
import useMediaQuery from "../hooks/useMediaQuery.tsx";
import { useWindowSize } from "@react-hook/window-size";
import {
  useContainerPosition,
  useInfiniteLoader,
  useMasonry,
  usePositioner,
  useScroller
} from "masonic";
import { useNavigate } from "react-router-dom";
import ShuinModal from "./shuin_modal.tsx";
import { useTranslation } from "react-i18next";


export default function ShuinMasonry() {
  const [shuin, setShuin] = useState<Shuin[]>([])
  const isDesktop = useMediaQuery('(min-width: 720px)');
  const loadedIndex = useRef<{ startIndex: number, stopIndex: number }[]>([]);

  const containerRef = useRef(null);
  const [windowWidth, height] = useWindowSize();
  const { offset, width } = useContainerPosition(containerRef, [
    windowWidth,
    height
  ]);
  const positioner = usePositioner({
    width,
    columnGutter: 8,
    columnCount: isDesktop ? 4 : 2,
  });
  const { scrollTop, isScrolling } = useScroller(offset);

  useEffect(() => {
    axios.get<Response<Shuin[]>>('https://gallery-api.boar.osaka/shuin/all', {
      params: {
        page_size: 20
      }
    }).then(res => {
      setShuin(res.data.payload)
    })
  }, [])

  const maybeLoadMore = useInfiniteLoader((startIndex, stopIndex, items) => {
    if (loadedIndex.current.find((e) => e.startIndex === startIndex && e.stopIndex === stopIndex)) {
      return;
    }
    loadedIndex.current.push({ startIndex, stopIndex })

    const lastDate = (items[items.length - 1] as Shuin).date
    axios.get<Response<Shuin[]>>('https://gallery-api.boar.osaka/shuin/all', {
      params: {
        page_size: stopIndex - startIndex,
        last_date: lastDate,
      }
    }).then((res) => {
      const newItems = res.data.payload.filter((item) => !shuin.find(s => s.id === item.id));
      if (newItems.length > 0) {
        setShuin((current) => [...current, ...newItems]);
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
    items: shuin,
    overscanBy: 3,
    itemHeightEstimate: 0,
    onRender: maybeLoadMore,
    render: MasonryCard,
    itemKey: (item) => item.id,
  })
}

const MasonryCard = ({ data }: { data: Shuin }) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const isDesktop = useMediaQuery('(min-width: 960px)');
  const navigate = useNavigate()
  const { t } = useTranslation()

  const openPhotoModel = useMemo(() => () => {
    history.pushState({}, '', `/shuin/${data.id}`)
    onOpen();
  }, [onOpen, data.id])

  return <Card
    radius="lg"
    className="border-none"
    isPressable={isDesktop}
    onPress={isDesktop ? openPhotoModel : undefined}
  >
    <CardBody className="overflow-visible p-0" onClick={isDesktop ? undefined : openPhotoModel}>
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
        style={{ height: 'auto' }}
      />
    </CardBody>
    <CardFooter className="text-small justify-between flex-wrap">
      <b>
        {data.place.name}
      </b>
      <p className="text-default-500">
        {t(`shuin.genre.${data.genre}`)}
      </p>
    </CardFooter>

    <ShuinModal shuin={data} isOpen={isOpen} onOpenChange={(isOpen, path) => {
      if (!isOpen && path) {
        navigate(path)
      } else if (!isOpen) {
        history.back()
      }
      onOpenChange()
    }}/>
  </Card>
};
