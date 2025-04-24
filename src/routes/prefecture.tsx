import PhotoMasonry from "../components/photo_masonry.tsx";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { Prefecture, Response } from "../models/gallery.ts";
import { Chip, Select, SelectItem } from "@heroui/react";
import { useTranslation } from "react-i18next";

export default function PrefecturePage() {
  const params = useParams()
  const [prefecture, setPrefecture] = useState<Prefecture>()
  const { t } = useTranslation()
  const navigate = useNavigate();

  useEffect(() => {
    axios.get<Response<Prefecture>>('https://api.gallery.boar.ac.cn/geo/prefecture', {
      params: {
        id: params.prefectureId,
        with_cities: true
      }
    }).then((res) => {
      setPrefecture(res.data.payload)
    })
  }, [params.prefectureId]);

  if (!prefecture) return;

  return <div className='px-2 pt-[1rem] pb-12'>
    <div className='text-5xl mb-4 md:mb-6 ml-2 pt-2'>
      {prefecture.name}
    </div>

    <div className='mb-8 md:mb-12'>
      <Select label={t('prefecture.city')} selectedKeys={[params.cityId ?? '0']} onChange={(e) => {
        if (e.target.value === '0') {
          navigate(`/prefecture/${params.prefectureId}`)
        } else {
          navigate(`/prefecture/${params.prefectureId}/city/${e.target.value}`)
        }
      }}>
        {[{
          id: 0,
          name: t('prefecture.all_area', { name: prefecture.name }),
          photos_count: prefecture.cities.reduce((a, o) => a + o.photos_count, 0)
        }, ...prefecture.cities].map((c) => (
          <SelectItem key={c.id} textValue={c.name} endContent={<Chip>{c.photos_count}</Chip>}>
            {c.name}
          </SelectItem>
        ))}
      </Select>
    </div>

    <div>
      {
        !params.cityId ?
          <PhotoMasonry prefectureId={params.prefectureId} key={'0'}/>
          :
          <PhotoMasonry cityId={params.cityId} key={params.cityId}/>
      }
    </div>
  </div>
}
