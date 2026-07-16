import { Button } from "@heroui/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { events, type Viewer } from "@photo-sphere-viewer/core";
import { GyroscopePlugin } from "@photo-sphere-viewer/gyroscope-plugin";
import { ReactPhotoSphereViewer } from "react-photo-sphere-viewer";
import { useTranslation } from "react-i18next";
import { TbMaximize, TbMinimize } from "react-icons/tb";
import "./panorama_viewer.css";

interface PanoramaViewerProps {
  mediumSrc: string;
  largeSrc?: string;
  copyrightText?: string;
  height: string;
}

const panoramaPlugins = [GyroscopePlugin];
const navbar = ["zoom", "gyroscope"];

function setPanorama(
  viewer: Viewer,
  src: string,
) {
  if (viewer.config.panorama === src) return;

  void viewer.setPanorama(src, {
    transition: false,
    showLoader: true,
  }).catch(() => undefined);
}

export default function PanoramaViewer({
  mediumSrc,
  largeSrc,
  copyrightText,
  height,
}: PanoramaViewerProps) {
  const { t } = useTranslation();
  const viewerRef = useRef<Viewer | null>(null);
  const fullscreenListenerRef = useRef<((event: events.FullscreenEvent) => void) | null>(null);
  const sourcesRef = useRef({ mediumSrc, largeSrc });
  const [fullscreenTarget, setFullscreenTarget] = useState<HTMLElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  sourcesRef.current = { mediumSrc, largeSrc };

  const lang = useMemo(() => ({
    loading: t("photo.panorama.loading"),
    loadError: t("photo.panorama.load_error"),
    webglError: t("photo.panorama.webgl_error"),
    zoom: t("photo.panorama.zoom"),
    zoomIn: t("photo.panorama.zoom_in"),
    zoomOut: t("photo.panorama.zoom_out"),
    moveUp: t("photo.panorama.move"),
    moveDown: t("photo.panorama.move"),
    moveLeft: t("photo.panorama.move"),
    moveRight: t("photo.panorama.move"),
    fullscreen: t("photo.panorama.fullscreen"),
    gyroscope: t("photo.panorama.gyroscope"),
  }), [t]);

  const releaseViewer = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const fullscreenListener = fullscreenListenerRef.current;
    if (fullscreenListener) {
      viewer.removeEventListener(events.FullscreenEvent.type, fullscreenListener);
    }

    fullscreenListenerRef.current = null;
    viewerRef.current = null;
  }, []);

  const handleReady = useCallback((viewer: Viewer) => {
    if (viewerRef.current === viewer) return;
    releaseViewer();

    const handleFullscreen = (event: events.FullscreenEvent) => {
      setIsFullscreen(event.fullscreenEnabled);
      const { mediumSrc: currentMediumSrc, largeSrc: currentLargeSrc } = sourcesRef.current;
      const nextSrc = event.fullscreenEnabled && currentLargeSrc
        ? currentLargeSrc
        : currentMediumSrc;

      setPanorama(viewer, nextSrc);
    };

    viewerRef.current = viewer;
    fullscreenListenerRef.current = handleFullscreen;
    setFullscreenTarget(viewer.parent);
    setIsFullscreen(viewer.isFullscreenEnabled());
    viewer.addEventListener(events.FullscreenEvent.type, handleFullscreen);
  }, [releaseViewer]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer?.isFullscreenEnabled()) return;

    setPanorama(viewer, largeSrc ?? mediumSrc);
  }, [largeSrc, mediumSrc]);

  useEffect(() => {
    viewerRef.current?.setOption("lang", lang);
  }, [lang]);

  useEffect(() => () => releaseViewer(), [releaseViewer]);

  return (
    <>
      <ReactPhotoSphereViewer
        src={mediumSrc}
        width="100%"
        height={height}
        navbar={navbar}
        plugins={panoramaPlugins}
        lang={lang}
        canvasBackground="#111113"
        containerClass="boar-panorama-viewer relative overflow-hidden"
        onReady={handleReady}
      />
      {fullscreenTarget ? createPortal(
        <div className="pointer-events-none absolute bottom-1 right-2 z-[1001] flex h-8 items-center gap-2">
          {copyrightText ? (
            <span className="max-w-[45vw] truncate text-tiny text-white/80 drop-shadow-sm md:text-small">
              {copyrightText}
            </span>
          ) : null}
          {largeSrc ? (
            <Button
              isIconOnly
              size="sm"
              radius="full"
              variant="flat"
              className="pointer-events-auto bg-black/50 text-white shadow-md backdrop-blur-md"
              aria-label={t(isFullscreen ? "photo.panorama.exit_fullscreen" : "photo.panorama.fullscreen")}
              title={t(isFullscreen ? "photo.panorama.exit_fullscreen" : "photo.panorama.fullscreen")}
              onPress={() => viewerRef.current?.toggleFullscreen()}
            >
              {isFullscreen ? <TbMinimize size={18}/> : <TbMaximize size={18}/>}
            </Button>
          ) : null}
        </div>,
        fullscreenTarget,
      ) : null}
    </>
  );
}
