import PhotoMasonry from "../components/photo_masonry.tsx";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { Prefecture, Response } from "../models/gallery.ts";


export default function PrefecturePage() {
  const {id} = useParams()
  const [prefecture, setPrefecture] = useState<Prefecture>()

  useEffect(() => {
    axios.get<Response<Prefecture>>('https://api.gallery.boar.ac.cn/geo/prefecture', {
      params: {
        id
      }
    }).then((res) => {
      setPrefecture(res.data.payload)
    })
  }, [id]);

  if (!prefecture) return;

  return <div className='px-2 pt-[1rem]'>
    <div className='text-5xl mb-8 md:mb-12 ml-2 pt-2'>
      {prefecture.name}
    </div>

    <div>
      <PhotoMasonry prefecture_id={id}/>
    </div>
  </div>
}
