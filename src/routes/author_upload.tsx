import axios from "axios";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  DatePicker,
  Divider,
  Input,
  Progress,
} from "@heroui/react";
import {
  ChangeEvent,
  DragEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
  TbCheck,
  TbCloudUpload,
  TbMapPin,
  TbPanoramaHorizontal,
  TbPhoto,
  TbPlus,
  TbSparkles,
} from "react-icons/tb";
import { Navigate, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth.ts";
import {
  ExifMetadataDraft,
  HdrImageTooLargeError,
  PanoramaThumbnail,
  PanoramaThumbnailAspect,
  PhotoMetadataPayload,
  readPhotoExif,
  UploadProgress,
  uploadPhoto,
  validateHdrFile,
} from "../services/photo_upload.ts";
import LocationPickerModal from "../components/location_picker_modal.tsx";
import PanoramaThumbnailEditor from "../components/panorama_thumbnail_editor.tsx";
import PlaceSelector from "../components/place_selector.tsx";
import type { Coordinate, PhotoType, Place, Response } from "../models/gallery.ts";
import {
  getLocalTimeZone,
  now,
  parseDateTime,
  type CalendarDateTime,
  type ZonedDateTime,
} from "@internationalized/date";

const EMPTY_METADATA: ExifMetadataDraft = {
  cameraManufacture: "",
  cameraModel: "",
  lensModel: "",
  datetimeLocal: "",
  timezone: "",
  exposureTime: "",
  exposureTimeRat: "",
  fNumber: "",
  photographicSensitivity: "",
  focalLength: "",
  altitude: "",
  latitude: "",
  longitude: "",
};

const TIMEZONE_PATTERN = /^UTC[+-](?:0\d|1\d|2[0-3]):[0-5]\d$/;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isAvif(file: File) {
  return file.type === "image/avif" || file.name.toLowerCase().endsWith(".avif");
}

function datetimeLocalFromValue(value: CalendarDateTime | ZonedDateTime) {
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${String(value.year).padStart(4, "0")}-${pad(value.month)}-${pad(value.day)}T${pad(value.hour)}:${pad(value.minute)}:${pad(value.second)}`;
}

function timezoneFromOffset(offset: number) {
  const totalMinutes = Math.round(offset / 60_000);
  const sign = totalMinutes >= 0 ? "+" : "-";
  const absolute = Math.abs(totalMinutes);
  return `UTC${sign}${String(Math.floor(absolute / 60)).padStart(2, "0")}:${String(absolute % 60).padStart(2, "0")}`;
}

function createEmptyMetadata(): ExifMetadataDraft {
  const current = now(getLocalTimeZone());
  return {
    ...EMPTY_METADATA,
    datetimeLocal: datetimeLocalFromValue(current),
    timezone: timezoneFromOffset(current.offset),
  };
}

function parseDatePickerValue(value: string): CalendarDateTime | null {
  try {
    return value ? parseDateTime(value) : null;
  } catch {
    return null;
  }
}

function coordinateFromMetadata(metadata: ExifMetadataDraft): Coordinate | undefined {
  if (!metadata.latitude.trim() || !metadata.longitude.trim()) return undefined;
  const latitude = Number(metadata.latitude);
  const longitude = Number(metadata.longitude);
  if (
    !Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
    !Number.isFinite(longitude) || longitude < -180 || longitude > 180
  ) return undefined;
  return { latitude, longitude };
}

function metadataPayload(metadata: ExifMetadataDraft, place?: Place): PhotoMetadataPayload | null {
  const cameraManufacture = metadata.cameraManufacture.trim();
  const cameraModel = metadata.cameraModel.trim();
  const lensModel = metadata.lensModel.trim();
  const exposureTimeRat = metadata.exposureTimeRat.trim();
  const timezone = metadata.timezone.trim().toUpperCase();
  const exposureTime = Number(metadata.exposureTime);
  const fNumber = Number(metadata.fNumber);
  const sensitivity = Number(metadata.photographicSensitivity);
  const focalLength = Number(metadata.focalLength);

  if (
    !cameraManufacture ||
    !cameraModel ||
    !lensModel ||
    !metadata.datetimeLocal ||
    !exposureTimeRat ||
    !TIMEZONE_PATTERN.test(timezone) ||
    !Number.isFinite(exposureTime) || exposureTime <= 0 ||
    !Number.isFinite(fNumber) || fNumber <= 0 ||
    !Number.isInteger(sensitivity) || sensitivity <= 0 || sensitivity > 65535 ||
    !Number.isFinite(focalLength) || focalLength <= 0
  ) {
    return null;
  }

  const altitude = metadata.altitude.trim() === "" ? null : Number(metadata.altitude);
  const hasLatitude = metadata.latitude.trim() !== "";
  const hasLongitude = metadata.longitude.trim() !== "";
  const latitude = Number(metadata.latitude);
  const longitude = Number(metadata.longitude);
  if (
    (altitude !== null && !Number.isFinite(altitude)) ||
    hasLatitude !== hasLongitude ||
    (hasLatitude && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) ||
    (hasLongitude && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180))
  ) {
    return null;
  }

  const datetimeLocal = metadata.datetimeLocal.length === 16
    ? `${metadata.datetimeLocal}:00`
    : metadata.datetimeLocal;
  const datetime = `${datetimeLocal}${timezone.slice(3)}`;
  if (!Number.isFinite(Date.parse(datetime))) return null;

  return {
    camera_manufacture: cameraManufacture,
    camera_model: cameraModel,
    lens_model: lensModel,
    datetime,
    exposure_time: exposureTime,
    exposure_time_rat: exposureTimeRat,
    f_number: fNumber,
    photographic_sensitivity: sensitivity,
    focal_length: focalLength,
    altitude,
    location: hasLatitude ? { latitude, longitude } : null,
    place: place ? { id: place.id } : null,
    timezone,
  };
}

export default function AuthorUpload() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { session, logout } = useAuth();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const hdrInputRef = useRef<HTMLInputElement>(null);
  const selectionIdRef = useRef(0);
  const [photoType, setPhotoType] = useState<PhotoType>("normal");
  const [source, setSource] = useState<File>();
  const [hdr, setHdr] = useState<File>();
  const [panoramaThumbnailAspect, setPanoramaThumbnailAspect] = useState<PanoramaThumbnailAspect>("3:2");
  const [panoramaThumbnail, setPanoramaThumbnail] = useState<PanoramaThumbnail>();
  const [previewUrl, setPreviewUrl] = useState("");
  const [metadata, setMetadata] = useState<ExifMetadataDraft>(createEmptyMetadata);
  const [isReadingExif, setIsReadingExif] = useState(false);
  const [isReadingHdr, setIsReadingHdr] = useState(false);
  const [isCapturingPanoramaThumbnail, setIsCapturingPanoramaThumbnail] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>();
  const [errorMessage, setErrorMessage] = useState("");
  const [photoId, setPhotoId] = useState<number>();
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [place, setPlace] = useState<Place>();

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const datePickerValue = useMemo(
    () => parseDatePickerValue(metadata.datetimeLocal),
    [metadata.datetimeLocal],
  );

  if (!session) return <Navigate to="/author-login?next=%2Fauthor-upload" replace/>;

  const isUploading = progress !== undefined;
  const isBusy = isReadingExif || isReadingHdr || isCapturingPanoramaThumbnail || isUploading;
  const currentCoordinate = coordinateFromMetadata(metadata);

  const updateMetadata = <Key extends keyof ExifMetadataDraft>(
    key: Key,
    value: ExifMetadataDraft[Key],
  ) => setMetadata((current) => ({ ...current, [key]: value }));

  const selectPhotoType = (nextType: PhotoType) => {
    if (isBusy || nextType === photoType) return;
    setPhotoType(nextType);
    setPanoramaThumbnail(undefined);
    setErrorMessage("");
    if (nextType === "panorama") setHdr(undefined);
  };

  const selectPhoto = async (file: File | undefined) => {
    if (!file || isBusy) return;
    if (!file.type.startsWith("image/")) {
      setErrorMessage(t("upload.error.invalid_photo"));
      return;
    }

    const selectionId = ++selectionIdRef.current;
    setSource(file);
    setHdr(undefined);
    setPanoramaThumbnail(undefined);
    setPlace(undefined);
    setPhotoId(undefined);
    setErrorMessage("");
    setPreviewUrl(URL.createObjectURL(file));
    setIsReadingExif(true);
    try {
      const exif = await readPhotoExif(file);
      if (selectionId === selectionIdRef.current) {
        setMetadata(exif.datetimeLocal ? exif : {
          ...exif,
          datetimeLocal: datetimeLocalFromValue(now(getLocalTimeZone())),
        });
      }
    } catch {
      if (selectionId === selectionIdRef.current) setMetadata(createEmptyMetadata());
    } finally {
      if (selectionId === selectionIdRef.current) setIsReadingExif(false);
    }
  };

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    void selectPhoto(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleHdrChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!isAvif(file)) {
      setErrorMessage(t("upload.error.invalid_hdr"));
      return;
    }
    setIsReadingHdr(true);
    void validateHdrFile(file)
      .then(() => {
        setHdr(file);
        setErrorMessage("");
      })
      .catch((error: unknown) => {
        setHdr(undefined);
        setErrorMessage(t(
          error instanceof HdrImageTooLargeError
            ? "upload.error.hdr_too_large"
            : "upload.error.invalid_hdr",
        ));
      })
      .finally(() => setIsReadingHdr(false));
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    void selectPhoto(event.dataTransfer.files?.[0]);
  };

  const handleSubmit = async () => {
    if (!source || isBusy) return;
    if (photoType === "panorama" && !panoramaThumbnail) {
      setErrorMessage(t("upload.error.panorama_thumb_required"));
      return;
    }
    const payload = metadataPayload(metadata, place);
    if (!payload) {
      setErrorMessage(t("upload.error.invalid_metadata"));
      return;
    }

    setErrorMessage("");
    setProgress({ stage: "processing", percent: 1 });
    try {
      const photo = await uploadPhoto({
        source,
        hdr,
        photoType,
        panoramaThumbnail,
        metadata: payload,
        token: session.token,
        onProgress: setProgress,
      });
      setPhotoId(photo.id);
    } catch (error) {
      if (axios.isAxiosError<Response<string>>(error)) {
        if (error.response?.status === 401) {
          logout();
          return;
        }
        const serverMessage = error.response?.data?.payload;
        setErrorMessage(
          error.response?.status === 400 && typeof serverMessage === "string"
            ? t("upload.error.rejected", { message: serverMessage })
            : t("upload.error.unavailable"),
        );
      } else if (error instanceof HdrImageTooLargeError) {
        setErrorMessage(t("upload.error.hdr_too_large"));
      } else if (error instanceof Error && error.message.startsWith("Object upload failed")) {
        setErrorMessage(t("upload.error.storage"));
      } else {
        setErrorMessage(t("upload.error.processing"));
      }
    } finally {
      setProgress(undefined);
    }
  };

  const reset = () => {
    selectionIdRef.current += 1;
    setPhotoType("normal");
    setSource(undefined);
    setHdr(undefined);
    setPanoramaThumbnailAspect("3:2");
    setPanoramaThumbnail(undefined);
    setPreviewUrl("");
    setMetadata(createEmptyMetadata());
    setPlace(undefined);
    setErrorMessage("");
    setPhotoId(undefined);
  };

  return (
    <div className="px-4 pb-20 pt-6 sm:px-6 sm:pt-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("upload.title")}</h1>
      </div>

      {photoId !== undefined ? (
        <Card className="border border-success-200 bg-success-50/60 dark:bg-success-100/10" shadow="sm">
          <CardBody className="items-center gap-4 px-6 py-12 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success text-success-foreground">
              <TbCheck size={30}/>
            </span>
            <div>
              <h2 className="text-2xl font-bold">{t("upload.success.title")}</h2>
              <p className="mt-2 text-default-500">{t("upload.success.description")}</p>
            </div>
            <div className="mt-2 flex flex-wrap justify-center gap-3">
              <Button color="primary" onPress={() => navigate(`/photo/${photoId}`)}>
                {t("upload.success.view")}
              </Button>
              <Button variant="bordered" startContent={<TbPlus size={18}/>} onPress={reset}>
                {t("upload.success.another")}
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-5">
          <Card shadow="sm">
            <CardHeader className="flex-col items-start px-5 pb-2 pt-5 sm:px-6">
              <h2 className="text-xl font-bold">{t("upload.type.title")}</h2>
            </CardHeader>
            <CardBody className="grid gap-3 px-5 pb-6 sm:grid-cols-2 sm:px-6">
              <button
                type="button"
                className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                  photoType === "normal"
                    ? "border-primary bg-primary-50/70 dark:bg-primary-100/10"
                    : "border-default-200 hover:border-default-400 hover:bg-default-50"
                }`}
                aria-pressed={photoType === "normal"}
                disabled={isBusy}
                onClick={() => selectPhotoType("normal")}
              >
                <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  photoType === "normal" ? "bg-primary text-primary-foreground" : "bg-default-100 text-default-600"
                }`}>
                  <TbPhoto size={19}/>
                </span>
                <span>
                  <span className="block font-semibold">{t("upload.type.normal")}</span>
                </span>
              </button>
              <button
                type="button"
                className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                  photoType === "panorama"
                    ? "border-primary bg-primary-50/70 dark:bg-primary-100/10"
                    : "border-default-200 hover:border-default-400 hover:bg-default-50"
                }`}
                aria-pressed={photoType === "panorama"}
                disabled={isBusy}
                onClick={() => selectPhotoType("panorama")}
              >
                <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  photoType === "panorama" ? "bg-primary text-primary-foreground" : "bg-default-100 text-default-600"
                }`}>
                  <TbPanoramaHorizontal size={20}/>
                </span>
                <span>
                  <span className="block font-semibold">{t("upload.type.panorama")}</span>
                </span>
              </button>
            </CardBody>
          </Card>

          <Card shadow="sm">
            <CardHeader className="flex-col items-start px-5 pb-2 pt-5 sm:px-6">
              <h2 className="text-xl font-bold">{t("upload.source.title")}</h2>
              <p className="text-small text-default-500">{t("upload.source.description")}</p>
            </CardHeader>
            <CardBody className="px-5 pb-6 sm:px-6">
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="hidden"
                onChange={handlePhotoChange}
              />
              {source ? (
                <div className="grid gap-5 sm:grid-cols-[minmax(180px,280px)_1fr] sm:items-center">
                  <div className="aspect-[4/3] overflow-hidden rounded-xl bg-default-100">
                    <img className="h-full w-full object-contain" src={previewUrl} alt=""/>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-primary">
                      <TbPhoto size={20}/>
                      <p className="truncate font-semibold text-foreground">{source.name}</p>
                    </div>
                    <p className="mt-1 text-small text-default-500">{formatBytes(source.size)}</p>
                    <Button
                      className="mt-4"
                      size="sm"
                      variant="bordered"
                      isDisabled={isBusy}
                      onPress={() => photoInputRef.current?.click()}
                    >
                      {t("upload.source.replace")}
                    </Button>
                    {isReadingExif ? (
                      <p className="mt-3 text-small text-default-500">{t("upload.source.reading_exif")}</p>
                    ) : null}
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="flex min-h-56 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-default-300 bg-default-50/60 px-6 text-center transition-colors hover:border-primary hover:bg-primary-50/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  onClick={() => photoInputRef.current?.click()}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={handleDrop}
                >
                  <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary">
                    <TbCloudUpload size={25}/>
                  </span>
                  <span className="font-semibold">{t("upload.source.choose")}</span>
                  <span className="mt-2 text-small text-default-500">{t("upload.source.formats")}</span>
                </button>
              )}
            </CardBody>
          </Card>

          {source && photoType === "panorama" && !isUploading ? (
            <Card shadow="sm">
              <CardHeader className="flex-col items-start px-5 pb-2 pt-5 sm:px-6">
                <div className="flex items-center gap-2">
                  <TbPanoramaHorizontal className="text-primary" size={21}/>
                  <h2 className="text-xl font-bold">{t("upload.panorama_thumb.title")}</h2>
                  <Chip size="sm" color="danger" variant="flat">{t("upload.required")}</Chip>
                </div>
                <p id="panorama-thumbnail-required" className="text-small text-default-500">
                  {t("upload.panorama_thumb.description")}
                </p>
              </CardHeader>
              <CardBody className="px-5 pb-6 sm:px-6">
                <PanoramaThumbnailEditor
                  sourceUrl={previewUrl}
                  aspect={panoramaThumbnailAspect}
                  thumbnail={panoramaThumbnail}
                  isDisabled={isBusy}
                  onAspectChange={(nextAspect) => {
                    setPanoramaThumbnailAspect(nextAspect);
                    setPanoramaThumbnail(undefined);
                    setErrorMessage("");
                  }}
                  onCapture={(thumbnail) => {
                    setPanoramaThumbnail(thumbnail);
                    setErrorMessage("");
                  }}
                  onCapturingChange={setIsCapturingPanoramaThumbnail}
                />
              </CardBody>
            </Card>
          ) : null}

          <Card shadow="sm">
            <CardHeader className="flex-col items-start px-5 pb-2 pt-5 sm:px-6">
              <h2 className="text-xl font-bold">{t("upload.metadata.title")}</h2>
              <p className="text-small text-default-500">{t("upload.metadata.description")}</p>
            </CardHeader>
            <CardBody className="gap-6 px-5 pb-6 sm:px-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input isRequired isDisabled={isBusy} label={t("upload.field.camera_manufacture")} labelPlacement="outside" variant="bordered" value={metadata.cameraManufacture} onValueChange={(value) => updateMetadata("cameraManufacture", value)}/>
                <Input isRequired isDisabled={isBusy} label={t("upload.field.camera_model")} labelPlacement="outside" variant="bordered" value={metadata.cameraModel} onValueChange={(value) => updateMetadata("cameraModel", value)}/>
                <Input isRequired isDisabled={isBusy} className="sm:col-span-2" label={t("upload.field.lens_model")} labelPlacement="outside" variant="bordered" value={metadata.lensModel} onValueChange={(value) => updateMetadata("lensModel", value)}/>
                <DatePicker
                  isRequired
                  isDisabled={isBusy}
                  hideTimeZone
                  showMonthAndYearPickers
                  granularity="second"
                  hourCycle={24}
                  label={t("upload.field.datetime")}
                  labelPlacement="outside"
                  variant="bordered"
                  value={datePickerValue}
                  onChange={(value) => updateMetadata(
                    "datetimeLocal",
                    value ? datetimeLocalFromValue(value) : "",
                  )}
                />
                <Input isRequired isDisabled={isBusy} label={t("upload.field.timezone")} description={t("upload.field.timezone_hint")} labelPlacement="outside" variant="bordered" value={metadata.timezone} onValueChange={(value) => updateMetadata("timezone", value)}/>
              </div>

              <Divider/>

              <div>
                <h3 className="mb-4 font-semibold">{t("upload.exposure.title")}</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Input isRequired isDisabled={isBusy} type="number" min="0" step="any" label={t("upload.field.exposure_time")} labelPlacement="outside" variant="bordered" value={metadata.exposureTime} onValueChange={(value) => updateMetadata("exposureTime", value)}/>
                  <Input isRequired isDisabled={isBusy} label={t("upload.field.exposure_time_rat")} labelPlacement="outside" variant="bordered" value={metadata.exposureTimeRat} onValueChange={(value) => updateMetadata("exposureTimeRat", value)}/>
                  <Input isRequired isDisabled={isBusy} type="number" min="0" step="any" label={t("upload.field.f_number")} labelPlacement="outside" variant="bordered" value={metadata.fNumber} onValueChange={(value) => updateMetadata("fNumber", value)}/>
                  <Input isRequired isDisabled={isBusy} type="number" min="1" max="65535" step="1" label={t("upload.field.iso")} labelPlacement="outside" variant="bordered" value={metadata.photographicSensitivity} onValueChange={(value) => updateMetadata("photographicSensitivity", value)}/>
                  <Input isRequired isDisabled={isBusy} type="number" min="0" step="any" label={t("upload.field.focal_length")} labelPlacement="outside" variant="bordered" value={metadata.focalLength} onValueChange={(value) => updateMetadata("focalLength", value)}/>
                </div>
              </div>

              <Divider/>

              <div>
                <h3 className="font-semibold">{t("upload.location.title")}</h3>
                <p className="mt-1 text-small text-default-500">{t("upload.location.description")}</p>
                <div className="mt-4">
                  <PlaceSelector
                    value={place}
                    token={session.token}
                    coordinate={currentCoordinate}
                    isDisabled={isBusy}
                    onChange={setPlace}
                    onUnauthorized={logout}
                  />
                </div>
                <div className="mb-4 mt-6 flex flex-wrap items-center justify-between gap-3">
                  <h4 className="text-small font-semibold">{t("upload.location.coordinates")}</h4>
                  <Button
                    className="dark:data-[disabled=true]:text-default-600 dark:data-[disabled=true]:opacity-70"
                    size="sm"
                    variant="flat"
                    color="primary"
                    isDisabled={isBusy}
                    startContent={<TbMapPin size={17}/>}
                    onPress={() => setIsLocationPickerOpen(true)}
                  >
                    {t("upload.location.choose_on_map")}
                  </Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Input isDisabled={isBusy} type="number" min="-90" max="90" step="any" label={t("upload.field.latitude")} labelPlacement="outside" variant="bordered" value={metadata.latitude} onValueChange={(value) => updateMetadata("latitude", value)}/>
                  <Input isDisabled={isBusy} type="number" min="-180" max="180" step="any" label={t("upload.field.longitude")} labelPlacement="outside" variant="bordered" value={metadata.longitude} onValueChange={(value) => updateMetadata("longitude", value)}/>
                  <Input isDisabled={isBusy} type="number" step="any" label={t("upload.field.altitude")} labelPlacement="outside" variant="bordered" value={metadata.altitude} onValueChange={(value) => updateMetadata("altitude", value)}/>
                </div>
              </div>
            </CardBody>
          </Card>

          {photoType === "normal" ? (
            <Card shadow="sm">
              <CardHeader className="flex-col items-start px-5 pb-2 pt-5 sm:px-6">
                <div className="flex items-center gap-2">
                  <TbSparkles className="text-warning" size={20}/>
                <h2 className="text-xl font-bold">{t("upload.hdr.title")}</h2>
                <Chip size="sm" variant="flat">{t("upload.optional")}</Chip>
              </div>
              <p className="text-small text-default-500">{t("upload.hdr.description")}</p>
            </CardHeader>
            <CardBody className="px-5 pb-6 sm:px-6">
              <input ref={hdrInputRef} type="file" accept="image/avif,.avif" className="hidden" onChange={handleHdrChange}/>
              {hdr ? (
                <Chip
                  variant="flat"
                  color="warning"
                  onClose={isBusy ? undefined : () => setHdr(undefined)}
                >
                  {hdr.name} · {formatBytes(hdr.size)}
                </Chip>
              ) : (
                <Button
                  variant="bordered"
                  isLoading={isReadingHdr}
                  isDisabled={!source || isBusy}
                  onPress={() => hdrInputRef.current?.click()}
                >
                  {t("upload.hdr.choose")}
                </Button>
              )}
              </CardBody>
            </Card>
          ) : null}

          {progress ? (
            <Card shadow="sm">
              <CardBody className="gap-3 px-5 py-5 sm:px-6">
                <div className="flex items-center justify-between gap-4 text-small">
                  <span className="font-medium">{t(`upload.stage.${progress.stage}`)}</span>
                  <span className="tabular-nums text-default-500">{progress.percent}%</span>
                </div>
                <Progress aria-label={t(`upload.stage.${progress.stage}`)} value={progress.percent} color="primary"/>
                <p className="text-tiny text-default-500">{t("upload.progress_notice")}</p>
              </CardBody>
            </Card>
          ) : null}

          {errorMessage ? (
            <p className="rounded-xl bg-danger-50 px-4 py-3 text-small text-danger dark:bg-danger-100/10" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <div className="flex flex-col items-stretch gap-3 px-1 py-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-small text-default-500">{t("upload.submit_hint")}</p>
            <Button
              className="sm:min-w-36"
              color="primary"
              isLoading={isUploading}
              isDisabled={
                !source ||
                isReadingExif ||
                isReadingHdr ||
                isCapturingPanoramaThumbnail ||
                (photoType === "panorama" && !panoramaThumbnail)
              }
              aria-describedby={
                photoType === "panorama" && !panoramaThumbnail
                  ? "panorama-thumbnail-required"
                  : undefined
              }
              startContent={isUploading ? null : <TbCloudUpload size={19}/>}
              onPress={() => void handleSubmit()}
            >
              {t("upload.submit")}
            </Button>
          </div>
        </div>
      )}
      <LocationPickerModal
        isOpen={isLocationPickerOpen}
        coordinate={currentCoordinate}
        onClose={() => setIsLocationPickerOpen(false)}
        onConfirm={(coordinate) => setMetadata((current) => ({
          ...current,
          latitude: coordinate.latitude.toFixed(6),
          longitude: coordinate.longitude.toFixed(6),
        }))}
        onClear={() => setMetadata((current) => ({
          ...current,
          latitude: "",
          longitude: "",
        }))}
      />
    </div>
  );
}
