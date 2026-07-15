import { Button } from "@heroui/react";
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { events, type Viewer } from "@photo-sphere-viewer/core";
import { GyroscopePlugin } from "@photo-sphere-viewer/gyroscope-plugin";
import { ReactPhotoSphereViewer } from "react-photo-sphere-viewer";
import { useTranslation } from "react-i18next";
import { TbMaximize, TbMinimize } from "react-icons/tb";
import "@photo-sphere-viewer/core/index.css";
import "react-photo-sphere-viewer/dist/index.css";

interface PanoramaViewerProps {
  mediumSrc: string;
  largeSrc?: string;
  height: string;
  className?: string;
}

const panoramaPlugins = [GyroscopePlugin];
const navbar = ["zoom", "gyroscope"];

function setPanorama(
  viewer: Viewer,
  src: string,
  currentSrcRef: RefObject<string>,
) {
  if (currentSrcRef.current === src) return;
  currentSrcRef.current = src;

  void viewer.setPanorama(src, {
    transition: false,
    showLoader: true,
  }).catch(() => undefined);
}

export default function PanoramaViewer({
  mediumSrc,
  largeSrc,
  height,
  className,
}: PanoramaViewerProps) {
  const { t } = useTranslation();
  const viewerRef = useRef<Viewer | null>(null);
  const fullscreenListenerRef = useRef<((event: events.FullscreenEvent) => void) | null>(null);
  const currentSrcRef = useRef(mediumSrc);
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
    setFullscreenTarget(null);
    setIsFullscreen(false);
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

      setPanorama(viewer, nextSrc, currentSrcRef);
    };

    viewerRef.current = viewer;
    currentSrcRef.current = sourcesRef.current.mediumSrc;
    fullscreenListenerRef.current = handleFullscreen;
    setFullscreenTarget(viewer.parent);
    setIsFullscreen(viewer.isFullscreenEnabled());
    viewer.addEventListener(events.FullscreenEvent.type, handleFullscreen);
    viewer.setOption("navbar", navbar);
    viewer.setOption("lang", lang);
  }, [lang, releaseViewer]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const nextSrc = viewer.isFullscreenEnabled() && largeSrc ? largeSrc : mediumSrc;
    setPanorama(viewer, nextSrc, currentSrcRef);
  }, [largeSrc, mediumSrc]);

  useEffect(() => {
    viewerRef.current?.setOption("lang", lang);
  }, [lang]);

  useEffect(() => releaseViewer, [releaseViewer]);

  return (
    <>
      <ReactPhotoSphereViewer
        src={mediumSrc}
        width="100%"
        height={height}
        navbar={navbar}
        plugins={panoramaPlugins}
        lang={lang}
        containerClass={`relative overflow-hidden ${className ?? ""}`.trim()}
        onReady={handleReady}
      />
      {largeSrc && fullscreenTarget ? createPortal(
        <Button
          isIconOnly
          size="sm"
          radius="full"
          variant="flat"
          className="absolute bottom-1 right-2 z-[1001] bg-black/50 text-white shadow-md backdrop-blur-md"
          aria-label={t(isFullscreen ? "photo.panorama.exit_fullscreen" : "photo.panorama.fullscreen")}
          title={t(isFullscreen ? "photo.panorama.exit_fullscreen" : "photo.panorama.fullscreen")}
          onPress={() => viewerRef.current?.toggleFullscreen()}
        >
          {isFullscreen ? <TbMinimize size={18}/> : <TbMaximize size={18}/>}
        </Button>,
        fullscreenTarget,
      ) : null}
    </>
  );
}
