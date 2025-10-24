import ShuinMasonry from "../components/shuin_masonry.tsx";
import { useTranslation } from "react-i18next";

export default function ShuinList() {
  const { t } = useTranslation()

  return <div className='px-2 pt-4 pb-12'>
    <div className='text-4xl md:text-5xl mb-6 md:mb-8 ml-2 pt-2'>
      {t('sidebar.shuin')}
    </div>

    <ShuinMasonry/>
  </div>
}
