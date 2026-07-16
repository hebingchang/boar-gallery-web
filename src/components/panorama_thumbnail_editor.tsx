import { Button, Chip } from "@heroui/react";
import { events, type Viewer } from "@photo-sphere-viewer/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { TbCamera, TbCheck, TbCropLandscape, TbCropPortrait } from "react-icons/tb";
import { ReactPhotoSphereViewer } from "react-photo-sphere-viewer";
import "./panorama_viewer.css";
import {
  canvasToWebp,
  panoramaThumbnailDimensions,
  type PanoramaThumbnail,
  type PanoramaThumbnailAspect,
} from "../services/photo_upload.ts";

interface PanoramaThumbnailEditorProps {
  sourceUrl: string;
  aspect: PanoramaThumbnailAspect;
  thumbnail?: PanoramaThumbnail;
  isDisabled?: boolean;
  onAspectChange: (aspect: PanoramaThumbnailAspect) => void;
  onCapture: (thumbnail: PanoramaThumbnail) => void;
  onCapturingChange: (isCapturing: boolean) => void;
}

const CAPTURE_RENDERER_PARAMETERS = {
  antialias: true,
  preserveDrawingBuffer: true,
};

function nextAnimationFrame() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

function drawViewerCanvas(
  source: HTMLCanvasElement,
  width: number,
  height: number,
) {
  const output = document.createElement("canvas");
  output.width = width;
  output.height = height;
  const context = output.getContext("2d");
  if (!context) throw new Error("Canvas 2D is unavailable");

  const targetAspect = width / height;
  const sourceAspect = source.width / source.height;
  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = source.width;
  let sourceHeight = source.height;
  if (sourceAspect > targetAspect) {
    sourceWidth = source.height * targetAspect;
    sourceX = (source.width - sourceWidth) / 2;
  } else if (sourceAspect < targetAspect) {
    sourceHeight = source.width / targetAspect;
    sourceY = (source.height - sourceHeight) / 2;
  }

  context.fillStyle = "#000000";
  context.fillRect(0, 0, width, height);
  context.drawImage(
    source,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    width,
    height,
  );
  return output;
}

export default function PanoramaThumbnailEditor({
  sourceUrl,
  aspect,
  thumbnail,
  isDisabled = false,
  onAspectChange,
  onCapture,
  onCapturingChange,
}: PanoramaThumbnailEditorProps) {
  const { t } = useTranslation();
  const viewportRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const removeViewerListenersRef = useRef<() => void>(() => undefined);
  const captureIdRef = useRef(0);
  const [isPanoramaReady, setIsPanoramaReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureError, setCaptureError] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");

  useEffect(() => {
    captureIdRef.current += 1;
    setIsCapturing(false);
    onCapturingChange(false);
    setCaptureError("");
    return () => {
      captureIdRef.current += 1;
    };
  }, [aspect, onCapturingChange, sourceUrl]);

  useEffect(() => setIsPanoramaReady(false), [sourceUrl]);

  useEffect(() => {
    if (!thumbnail) {
      setThumbnailUrl("");
      return;
    }
    const url = URL.createObjectURL(thumbnail.blob);
    setThumbnailUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [thumbnail]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const viewer = viewerRef.current;
    if (!viewport || !viewer || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => viewer.autoSize());
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [aspect, isPanoramaReady]);

  useEffect(() => () => {
    removeViewerListenersRef.current();
    viewerRef.current = null;
  }, []);

  const handleReady = useCallback((viewer: Viewer) => {
    removeViewerListenersRef.current();
    viewerRef.current = viewer;
    setIsPanoramaReady(true);

    const handlePanoramaLoad = () => setIsPanoramaReady(false);
    const handlePanoramaLoaded = () => setIsPanoramaReady(true);
    const handlePanoramaError = () => {
      setIsPanoramaReady(false);
      setCaptureError(t("upload.panorama_thumb.load_error"));
    };
    viewer.addEventListener(events.PanoramaLoadEvent.type, handlePanoramaLoad);
    viewer.addEventListener(events.PanoramaLoadedEvent.type, handlePanoramaLoaded);
    viewer.addEventListener(events.PanoramaErrorEvent.type, handlePanoramaError);
    removeViewerListenersRef.current = () => {
      viewer.removeEventListener(events.PanoramaLoadEvent.type, handlePanoramaLoad);
      viewer.removeEventListener(events.PanoramaLoadedEvent.type, handlePanoramaLoaded);
      viewer.removeEventListener(events.PanoramaErrorEvent.type, handlePanoramaError);
    };
  }, [t]);

  const viewerLanguage = useMemo(() => ({
    loading: t("photo.panorama.loading"),
    loadError: t("photo.panorama.load_error"),
    webglError: t("photo.panorama.webgl_error"),
    zoom: t("photo.panorama.zoom"),
    zoomIn: t("photo.panorama.zoom_in"),
    zoomOut: t("photo.panorama.zoom_out"),
    move: t("photo.panorama.move"),
  }), [t]);

  const capture = async () => {
    const viewer = viewerRef.current;
    if (!viewer || !isPanoramaReady || isDisabled) return;
    const captureId = ++captureIdRef.current;
    setIsCapturing(true);
    onCapturingChange(true);
    setCaptureError("");
    try {
      viewer.needsUpdate();
      await nextAnimationFrame();
      await nextAnimationFrame();
      const sourceCanvas = viewer.container.querySelector("canvas");
      if (!sourceCanvas || sourceCanvas.width === 0 || sourceCanvas.height === 0) {
        throw new Error("The panorama canvas is unavailable");
      }
      const dimensions = panoramaThumbnailDimensions(aspect);
      const output = drawViewerCanvas(sourceCanvas, dimensions.width, dimensions.height);
      const blob = await canvasToWebp(output);
      if (captureIdRef.current !== captureId) return;
      onCapture({ blob, ...dimensions });
    } catch {
      if (captureIdRef.current === captureId) {
        setCaptureError(t("upload.panorama_thumb.capture_error"));
      }
    } finally {
      if (captureIdRef.current === captureId) {
        setIsCapturing(false);
        onCapturingChange(false);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label={t("upload.panorama_thumb.ratio")}>
        <Button
          size="sm"
          color={aspect === "3:2" ? "primary" : "default"}
          variant={aspect === "3:2" ? "solid" : "bordered"}
          startContent={<TbCropLandscape size={17}/>}
          isDisabled={isDisabled}
          aria-pressed={aspect === "3:2"}
          onPress={() => onAspectChange("3:2")}
        >
          {t("upload.panorama_thumb.landscape")}
        </Button>
        <Button
          size="sm"
          color={aspect === "2:3" ? "primary" : "default"}
          variant={aspect === "2:3" ? "solid" : "bordered"}
          startContent={<TbCropPortrait size={17}/>}
          isDisabled={isDisabled}
          aria-pressed={aspect === "2:3"}
          onPress={() => onAspectChange("2:3")}
        >
          {t("upload.panorama_thumb.portrait")}
        </Button>
      </div>

      <div
        ref={viewportRef}
        className={`relative mx-auto overflow-hidden rounded-xl bg-black shadow-inner ${
          aspect === "3:2" ? "aspect-[3/2] w-full" : "aspect-[2/3] w-full max-w-sm"
        }`}
      >
        <ReactPhotoSphereViewer
          src={sourceUrl}
          width="100%"
          height="100%"
          navbar={["zoom", "move"]}
          lang={viewerLanguage}
          canvasBackground="#111113"
          containerClass="boar-panorama-viewer"
          rendererParameters={CAPTURE_RENDERER_PARAMETERS}
          onReady={handleReady}
        />
      </div>

      <p className="text-small text-default-500">{t("upload.panorama_thumb.hint")}</p>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          color="primary"
          variant={thumbnail ? "bordered" : "solid"}
          startContent={isCapturing ? null : <TbCamera size={18}/>}
          isLoading={isCapturing}
          isDisabled={isDisabled || !isPanoramaReady}
          onPress={() => void capture()}
        >
          {t(thumbnail ? "upload.panorama_thumb.recapture" : "upload.panorama_thumb.capture")}
        </Button>
        {thumbnail ? (
          <span role="status" aria-live="polite">
            <Chip color="success" variant="flat" startContent={<TbCheck size={15}/>}>
              {t("upload.panorama_thumb.captured")}
            </Chip>
          </span>
        ) : null}
      </div>

      {thumbnail && thumbnailUrl ? (
        <div className="flex items-center gap-3 rounded-xl border border-default-200 bg-default-50 p-3">
          <img
            className="max-h-24 max-w-36 rounded-lg object-contain"
            src={thumbnailUrl}
            alt={t("upload.panorama_thumb.preview_alt")}
          />
          <div className="text-small text-default-500">
            <p className="font-semibold text-foreground">{t("upload.panorama_thumb.preview")}</p>
            <p>{thumbnail.width} × {thumbnail.height} WebP</p>
          </div>
        </div>
      ) : null}

      {captureError ? (
        <p className="rounded-lg bg-danger-50 px-3 py-2 text-small text-danger" role="alert">
          {captureError}
        </p>
      ) : null}
    </div>
  );
}
