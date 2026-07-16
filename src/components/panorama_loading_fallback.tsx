import { Spinner } from "@heroui/react";
import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";

interface PanoramaLoadingFallbackProps {
  style?: CSSProperties;
}

export default function PanoramaLoadingFallback({
  style,
}: PanoramaLoadingFallbackProps) {
  const { t } = useTranslation();

  return (
    <div
      role="status"
      className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[#111113] text-white/70"
      style={style}
    >
      <Spinner aria-hidden="true" color="white" size="sm"/>
      <p className="text-small">{t("photo.panorama.loading")}</p>
    </div>
  );
}
