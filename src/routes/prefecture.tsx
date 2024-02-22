import PhotoMasonry from "../components/photo_masonry.tsx";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { Prefecture, Response } from "../models/gallery.ts";
import { Chip, Select, SelectItem } from "@nextui-org/react";
import { useTranslation } from "react-i18next";

export default function PrefecturePage() {
  const {id} = useParams()
  const [prefecture, setPrefecture] = useState<Prefecture>()
  const [cityId, setCityId] = useState('0')
  const {t} = useTranslation()

  useEffect(() => {
    axios.get<Response<Prefecture>>('https://api.gallery.boar.ac.cn/geo/prefecture', {
      params: {
        id,
        with_cities: true
      }
    }).then((res) => {
      setPrefecture(res.data.payload)
    })
  }, [id]);

  if (!prefecture) return;

  return <div className='px-2 pt-[1rem] pb-12'>
    <div className='text-5xl mb-4 md:mb-6 ml-2 pt-2'>
      {prefecture.name}
    </div>

    <div className='mb-8 md:mb-12'>
      <Select label={t('prefecture.city')} defaultSelectedKeys={[cityId]} onChange={(e) => setCityId(e.target.value)}>
        {[{
          id: 0,
          name: t('prefecture.all_area', {name: prefecture.name}),
          photos_count: prefecture.cities.reduce((a, o) => a + o.photos_count, 0)
        }, ...prefecture.cities].map((c) => (
          <SelectItem key={c.id} value={c.id} endContent={<Chip>{c.photos_count}</Chip>}>
            {c.name}
          </SelectItem>
        ))}
      </Select>
    </div>

    <div>
      {
        cityId === '0' ?
          <PhotoMasonry prefectureId={id} key={cityId}/>
          :
          <PhotoMasonry cityId={cityId} key={cityId}/>
      }
    </div>
  </div>
}
