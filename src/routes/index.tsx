import { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Photo, Response } from "../models/gallery.ts";
import { Masonry, useInfiniteLoader } from "masonic";
import { Card, Image, CardFooter, CardBody, useDisclosure } from "@nextui-org/react";
import useMediaQuery from "../hooks/useMediaQuery.tsx";
import PhotoModal from "../components/photo_modal.tsx";
import { LoadingContext } from "../contexts/loading.tsx";

export default function Index() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const isDesktop = useMediaQuery('(min-width: 960px)');

  const maybeLoadMore = useInfiniteLoader((startIndex, stopIndex, items) => {
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

  useEffect(() => {
    axios.get<Response<Photo[]>>('https://api.gallery.boar.ac.cn/photos/all?page_size=20').then(res => {
      setPhotos(res.data.payload)
    })
  }, [])

  console.log(photos)

  return (
    <div>
      <Masonry
        items={photos}
        render={MasonryCard}
        columnGutter={isDesktop ? 24 : 12}
        columnCount={isDesktop ? 3 : 2}
        onRender={maybeLoadMore}
        overscanBy={3}
      />
    </div>
  );
}

const MasonryCard = ({data}: { index: number, data: Photo, width: number }) => {
  const {isOpen, onOpen, onOpenChange} = useDisclosure();
  const [photo, setPhoto] = useState<Photo>(data);
  const loading = useContext(LoadingContext)

  const openPhotoModel = useMemo(() => () => {
    if (loading && !loading.loading) {
      loading.setLoading(true)
      if (!photo.medium_file) {
        axios.get<Response<Photo>>(`https://api.gallery.boar.ac.cn/photos/get?id=${data.id}`).then(res => {
          setPhoto(res.data.payload)
          onOpen();
          loading.setLoading(false);
        })
      } else {
        onOpen();
        loading.setLoading(false)
      }
    }
  }, [data.id, loading, onOpen, photo.medium_file])

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
        <CardFooter className="text-small justify-between">
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

    <PhotoModal photo={photo} isOpen={isOpen} onOpenChange={onOpenChange}/>
  </Card>
};
