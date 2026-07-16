import axios from "axios";
import { load, type ExpandedTags } from "exifreader";
import SparkMD5 from "spark-md5";
import photonWasmUrl from "@silvia-odwyer/photon/photon_rs_bg.wasm?url";
import type { Photo, PhotoType, Place, Response } from "../models/gallery.ts";

const API_ORIGIN = "https://api.gallery.boar.ac.cn";
const PHOTO_OBJECT_NAMES = ["thumb", "medium", "large", "origin"] as const;
const NORMAL_VARIANT_LONGEST_EDGES = {
  thumb: 512,
  medium: 1920,
  large: 3840,
  origin: null,
} as const;
const PANORAMA_VARIANT_NAMES = ["medium", "large", "origin"] as const;
const PANORAMA_VARIANT_MAX_HEIGHTS = {
  medium: 3600,
  large: 7200,
  origin: null,
} as const;
const PANORAMA_THUMBNAIL_DIMENSIONS = {
  "3:2": { width: 510, height: 340 },
  "2:3": { width: 340, height: 510 },
} as const;
export const HDR_MAX_LONGEST_EDGE = 3840;

export type UploadStage = "processing" | "presigning" | "uploading" | "completing";

export interface UploadProgress {
  stage: UploadStage;
  percent: number;
}

export interface ExifMetadataDraft {
  cameraManufacture: string;
  cameraModel: string;
  lensModel: string;
  datetimeLocal: string;
  timezone: string;
  exposureTime: string;
  exposureTimeRat: string;
  fNumber: string;
  photographicSensitivity: string;
  focalLength: string;
  altitude: string;
  latitude: string;
  longitude: string;
}

export interface PhotoMetadataPayload {
  camera_manufacture: string;
  camera_model: string;
  lens_model: string;
  datetime: string;
  exposure_time: number;
  exposure_time_rat: string;
  f_number: number;
  photographic_sensitivity: number;
  focal_length: number;
  altitude: number | null;
  location: {
    longitude: number;
    latitude: number;
  } | null;
  place: Pick<Place, "id"> | null;
  timezone: string;
}

export interface UploadFileInfo {
  size: number;
  digest: string;
  width: number;
  height: number;
}

export interface PreparedPhotoVariant extends UploadFileInfo {
  blob: Blob;
}

export type PanoramaThumbnailAspect = keyof typeof PANORAMA_THUMBNAIL_DIMENSIONS;

export interface PanoramaThumbnail {
  blob: Blob;
  width: number;
  height: number;
}

export class HdrImageTooLargeError extends Error {
  constructor(
    readonly width: number,
    readonly height: number,
  ) {
    super(`HDR image dimensions ${width}x${height} exceed the ${HDR_MAX_LONGEST_EDGE}px limit`);
    this.name = "HdrImageTooLargeError";
  }
}

type PhotoObjectBaseName = typeof PHOTO_OBJECT_NAMES[number];
type PanoramaVariantName = typeof PANORAMA_VARIANT_NAMES[number];
type PhotoObjectName =
  | PhotoObjectBaseName
  | "hdr";
export type PreparedPhotoVariants = Record<PhotoObjectBaseName, PreparedPhotoVariant>;
type PreparedFiles = PreparedPhotoVariants & { hdr?: PreparedPhotoVariant };

interface UploadObject {
  key: string;
  url: string;
  method: string;
  headers: Record<string, string[]>;
}

interface UploadPlan {
  upload_token: string;
  expires_at: string;
  objects: Record<string, UploadObject>;
}

export type PhotoUploadType = "photo";

export interface PhotoPresignRequest {
  type: PhotoUploadType;
  storage: "jcloud";
  naming_date: string;
  source_digest: string;
  has_hdr: boolean;
}

export interface UploadPhotoOptions {
  source: File;
  hdr?: File;
  photoType: PhotoType;
  panoramaThumbnail?: PanoramaThumbnail;
  metadata: PhotoMetadataPayload;
  token: string;
  onProgress?: (progress: UploadProgress) => void;
}

type ExifTag = {
  value?: unknown;
  description?: unknown;
  computed?: unknown;
};

function textFromTag(tag: ExifTag | undefined): string {
  if (typeof tag?.description === "string") return tag.description.trim();
  if (typeof tag?.value === "string") return tag.value.trim();
  if (Array.isArray(tag?.value)) return tag.value.map(String).join("").trim();
  return "";
}

function numberFromTag(tag: ExifTag | undefined): number | undefined {
  if (typeof tag?.computed === "number" && Number.isFinite(tag.computed)) return tag.computed;
  if (typeof tag?.value === "number" && Number.isFinite(tag.value)) return tag.value;
  if (Array.isArray(tag?.value)) {
    if (
      tag.value.length === 2 &&
      typeof tag.value[0] === "number" &&
      typeof tag.value[1] === "number" &&
      tag.value[1] !== 0
    ) {
      return tag.value[0] / tag.value[1];
    }
    const first = tag.value[0];
    if (typeof first === "number" && Number.isFinite(first)) return first;
  }
  return undefined;
}

function rationalFromTag(tag: ExifTag | undefined): string {
  if (!Array.isArray(tag?.value) || tag.value.length !== 2) return textFromTag(tag);
  const [numerator, denominator] = tag.value;
  if (typeof numerator !== "number" || typeof denominator !== "number" || denominator === 0) {
    return textFromTag(tag);
  }
  const divisor = greatestCommonDivisor(Math.abs(numerator), Math.abs(denominator));
  return `${numerator / divisor}/${denominator / divisor}`;
}

function greatestCommonDivisor(left: number, right: number): number {
  let a = Math.round(left);
  let b = Math.round(right);
  while (b !== 0) [a, b] = [b, a % b];
  return a || 1;
}

function browserTimezone(): string {
  const minutes = -new Date().getTimezoneOffset();
  const sign = minutes >= 0 ? "+" : "-";
  const absolute = Math.abs(minutes);
  return `UTC${sign}${String(Math.floor(absolute / 60)).padStart(2, "0")}:${String(absolute % 60).padStart(2, "0")}`;
}

function normalizeTimezone(value: string): string {
  const match = value.trim().match(/^(?:UTC)?([+-])(\d{2}):?(\d{2})$/i);
  return match ? `UTC${match[1]}${match[2]}:${match[3]}` : browserTimezone();
}

function localDatetimeFromExif(value: string): string {
  const match = value.match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return "";
  return `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6] ?? "00"}`;
}

function stringifyNumber(value: number | undefined): string {
  return value === undefined ? "" : String(value);
}

export async function readPhotoExif(file: File): Promise<ExifMetadataDraft> {
  let tags: ExpandedTags = {};
  try {
    tags = await load(file, { expanded: true });
  } catch {
    // Missing or unsupported metadata should not prevent manual entry.
  }

  const exif = tags.exif;
  const timezone = normalizeTimezone(textFromTag(exif?.OffsetTimeOriginal ?? exif?.OffsetTime));
  const datetime = textFromTag(exif?.DateTimeOriginal ?? exif?.DateTime);

  return {
    cameraManufacture: textFromTag(exif?.Make),
    cameraModel: textFromTag(exif?.Model),
    lensModel: textFromTag(exif?.LensModel),
    datetimeLocal: localDatetimeFromExif(datetime),
    timezone,
    exposureTime: stringifyNumber(numberFromTag(exif?.ExposureTime)),
    exposureTimeRat: rationalFromTag(exif?.ExposureTime),
    fNumber: stringifyNumber(numberFromTag(exif?.FNumber)),
    photographicSensitivity: stringifyNumber(numberFromTag(exif?.ISOSpeedRatings)),
    focalLength: stringifyNumber(numberFromTag(exif?.FocalLength)),
    altitude: stringifyNumber(tags.gps?.Altitude),
    latitude: stringifyNumber(tags.gps?.Latitude),
    longitude: stringifyNumber(tags.gps?.Longitude),
  };
}

export function variantDimensions(width: number, height: number, longestEdge: number | null) {
  if (longestEdge === null) return { width, height };
  const scale = Math.min(1, longestEdge / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export function panoramaVariantDimensions(width: number, height: number, maxHeight: number | null) {
  if (maxHeight === null) return { width, height };
  const scale = Math.min(1, maxHeight / height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export function panoramaThumbnailDimensions(aspect: PanoramaThumbnailAspect) {
  return { ...PANORAMA_THUMBNAIL_DIMENSIONS[aspect] };
}

export function assertPanoramaThumbnail(thumbnail: PanoramaThumbnail) {
  if (thumbnail.blob.type !== "image/webp") {
    throw new Error("Panorama thumbnail must be a WebP image");
  }
  const hasValidDimensions = Object.values(PANORAMA_THUMBNAIL_DIMENSIONS).some(
    ({ width, height }) => thumbnail.width === width && thumbnail.height === height,
  );
  if (!hasValidDimensions) {
    throw new Error("Panorama thumbnail dimensions must be 510x340 or 340x510 pixels");
  }
}

export function assertHdrDimensions(width: number, height: number) {
  if (Math.max(width, height) > HDR_MAX_LONGEST_EDGE) {
    throw new HdrImageTooLargeError(width, height);
  }
}

function uint8ArrayToBlob(bytes: Uint8Array, type: string) {
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return new Blob([buffer], { type });
}

async function sha256(blob: Blob) {
  if (!globalThis.crypto?.subtle) throw new Error("Web Crypto is unavailable");
  const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function canvasToWebp(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob?.type === "image/webp") resolve(blob);
      else reject(new Error("This browser cannot create a WebP image"));
    }, "image/webp", 1);
  });
}

const MD5_CHUNK_SIZE = 2 * 1024 * 1024;

export async function md5Hex(blob: Blob) {
  const hasher = new SparkMD5.ArrayBuffer();
  try {
    for (let offset = 0; offset < blob.size; offset += MD5_CHUNK_SIZE) {
      hasher.append(await blob.slice(offset, offset + MD5_CHUNK_SIZE).arrayBuffer());
    }
    return hasher.end();
  } finally {
    hasher.destroy();
  }
}

export function expectedPhotoObjectNames(
  photoType: PhotoType,
  hasHdr = false,
): PhotoObjectName[] {
  return photoType === "normal" && hasHdr
    ? [...PHOTO_OBJECT_NAMES, "hdr"]
    : [...PHOTO_OBJECT_NAMES];
}

function assertPhotoObjectNames(
  label: string,
  actualNames: readonly string[],
  photoType: PhotoType,
  hasHdr: boolean,
) {
  const expected = [...expectedPhotoObjectNames(photoType, hasHdr)].sort();
  const actual = [...actualNames].sort();
  if (
    expected.length !== actual.length ||
    expected.some((name, index) => name !== actual[index])
  ) {
    throw new Error(
      `${label} do not match the ${photoType} upload contract ` +
      `(expected: ${expected.join(", ")}; received: ${actual.join(", ")})`,
    );
  }
}

export function buildPhotoPresignRequest(
  metadata: Pick<PhotoMetadataPayload, "datetime">,
  sourceDigest: string,
  photoType: PhotoType,
  hasHdr: boolean,
): PhotoPresignRequest {
  const namingDate = metadata.datetime.match(/^(\d{4}-\d{2}-\d{2})T/)?.[1];
  if (!namingDate) throw new Error("Photo datetime must include a local YYYY-MM-DD date");
  if (!/^[0-9a-f]{32}$/.test(sourceDigest)) throw new Error("Source digest must be a lowercase MD5 hash");

  return {
    type: "photo",
    storage: "jcloud",
    naming_date: namingDate,
    source_digest: sourceDigest,
    has_hdr: photoType === "normal" && hasHdr,
  };
}

async function prepareResizedVariants<Name extends string>(
  source: File,
  variantNames: readonly Name[],
  dimensionsFor: (name: Name, width: number, height: number) => { width: number; height: number },
  onProgress?: (progress: UploadProgress) => void,
): Promise<Record<Name, PreparedPhotoVariant>> {
  const photon = await import("@silvia-odwyer/photon");
  await photon.default({ module_or_path: photonWasmUrl });
  onProgress?.({ stage: "processing", percent: 5 });

  const bitmap = await createImageBitmap(source, { imageOrientation: "from-image" });
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    bitmap.close();
    throw new Error("Canvas 2D is unavailable");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const photonImage = new photon.PhotonImage(new Uint8Array(imageData.data), canvas.width, canvas.height);
  bitmap.close();
  canvas.width = 1;
  canvas.height = 1;

  const prepared = {} as Record<Name, PreparedPhotoVariant>;
  try {
    for (const [index, name] of variantNames.entries()) {
      const dimensions = dimensionsFor(name, photonImage.get_width(), photonImage.get_height());
      const isOriginalSize = dimensions.width === photonImage.get_width() && dimensions.height === photonImage.get_height();
      const output = isOriginalSize
        ? photonImage
        : photon.resize(photonImage, dimensions.width, dimensions.height, photon.SamplingFilter.Lanczos3);

      try {
        const blob = uint8ArrayToBlob(output.get_bytes_webp(), "image/webp");
        prepared[name] = {
          blob,
          size: blob.size,
          digest: await sha256(blob),
          width: dimensions.width,
          height: dimensions.height,
        };
      } finally {
        if (!isOriginalSize) output.free();
      }
      onProgress?.({
        stage: "processing",
        percent: 10 + Math.round(((index + 1) / variantNames.length) * 36),
      });
    }
  } finally {
    photonImage.free();
  }

  return prepared;
}

export function preparePhotoVariants(
  source: File,
  onProgress?: (progress: UploadProgress) => void,
): Promise<PreparedPhotoVariants> {
  return prepareResizedVariants(
    source,
    PHOTO_OBJECT_NAMES,
    (name, width, height) => variantDimensions(
      width,
      height,
      NORMAL_VARIANT_LONGEST_EDGES[name],
    ),
    onProgress,
  );
}

export async function preparePanoramaVariants(
  source: File,
  thumbnail: PanoramaThumbnail,
  onProgress?: (progress: UploadProgress) => void,
): Promise<PreparedPhotoVariants> {
  assertPanoramaThumbnail(thumbnail);

  const thumb: PreparedPhotoVariant = {
    blob: thumbnail.blob,
    size: thumbnail.blob.size,
    digest: await sha256(thumbnail.blob),
    width: thumbnail.width,
    height: thumbnail.height,
  };
  onProgress?.({ stage: "processing", percent: 5 });

  const bitmap = await createImageBitmap(source, { imageOrientation: "from-image" });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("Canvas 2D is unavailable");
  }

  const resized = {} as Record<PanoramaVariantName, PreparedPhotoVariant>;
  const preparedByDimensions = new Map<string, PreparedPhotoVariant>();
  try {
    for (const [index, name] of PANORAMA_VARIANT_NAMES.entries()) {
      const dimensions = panoramaVariantDimensions(
        bitmap.width,
        bitmap.height,
        PANORAMA_VARIANT_MAX_HEIGHTS[name],
      );
      const dimensionsKey = `${dimensions.width}x${dimensions.height}`;
      const prepared = preparedByDimensions.get(dimensionsKey);
      if (prepared) {
        resized[name] = prepared;
      } else {
        canvas.width = dimensions.width;
        canvas.height = dimensions.height;
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(bitmap, 0, 0, dimensions.width, dimensions.height);

        try {
          const blob = await canvasToWebp(canvas);
          const nextPrepared = {
            blob,
            size: blob.size,
            digest: await sha256(blob),
            width: dimensions.width,
            height: dimensions.height,
          };
          resized[name] = nextPrepared;
          preparedByDimensions.set(dimensionsKey, nextPrepared);
        } finally {
          canvas.width = 1;
          canvas.height = 1;
        }
      }
      onProgress?.({
        stage: "processing",
        percent: 10 + Math.round(((index + 1) / PANORAMA_VARIANT_NAMES.length) * 36),
      });
    }
  } finally {
    bitmap.close();
    canvas.width = 1;
    canvas.height = 1;
  }

  return { thumb, ...resized };
}

export async function validateHdrFile(file: File) {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const dimensions = { width: bitmap.width, height: bitmap.height };
    assertHdrDimensions(dimensions.width, dimensions.height);
    return dimensions;
  } finally {
    bitmap.close();
  }
}

async function prepareHdr(file: File): Promise<PreparedPhotoVariant> {
  const dimensions = await validateHdrFile(file);
  return {
    blob: file,
    size: file.size,
    digest: await sha256(file),
    ...dimensions,
  };
}

function authorizationHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

async function putObject(target: UploadObject, blob: Blob) {
  const headers = new Headers();
  for (const [name, values] of Object.entries(target.headers)) headers.set(name, values.join(","));
  const response = await fetch(target.url, { method: target.method, headers, body: blob });
  if (!response.ok) throw new Error(`Object upload failed (${response.status})`);
}

export function buildPhotoCompleteRequest(
  photoType: PhotoType,
  uploadToken: string,
  originalName: string,
  preparedFiles: PreparedFiles,
  metadata: PhotoMetadataPayload,
  hdrOriginalName = "",
) {
  const hasHdr = photoType === "normal" && Object.prototype.hasOwnProperty.call(preparedFiles, "hdr");
  const objectNames = expectedPhotoObjectNames(photoType, hasHdr);
  assertPhotoObjectNames(
    "Prepared files",
    Object.keys(preparedFiles),
    photoType,
    hasHdr,
  );
  const preparedByName = preparedFiles as Partial<Record<PhotoObjectName, PreparedPhotoVariant>>;
  const files = Object.fromEntries(objectNames.map((name) => {
    const prepared = preparedByName[name];
    if (!prepared) throw new Error(`Prepared file is missing: ${name}`);
    const { size, digest, width, height } = prepared;
    return [name, { size, digest, width, height }];
  }));

  return {
    type: "photo",
    upload_token: uploadToken,
    original_name: originalName,
    files,
    photo: {
      type: photoType,
      hdr_original_name: hasHdr ? hdrOriginalName : "",
      metadata,
    },
  };
}

export async function uploadPhoto({
  source,
  hdr,
  photoType,
  panoramaThumbnail,
  metadata,
  token,
  onProgress,
}: UploadPhotoOptions): Promise<Photo> {
  if (photoType === "panorama" && !panoramaThumbnail) {
    throw new Error("A panorama thumbnail is required");
  }

  const sourceDigest = await md5Hex(source);
  const effectiveHdr = photoType === "normal" ? hdr : undefined;
  const preparedHdr = effectiveHdr ? await prepareHdr(effectiveHdr) : undefined;
  let preparedFiles: PreparedFiles;
  if (photoType === "panorama") {
    preparedFiles = await preparePanoramaVariants(source, panoramaThumbnail!, onProgress);
  } else {
    const regularFiles = await preparePhotoVariants(source, onProgress);
    preparedFiles = preparedHdr ? { ...regularFiles, hdr: preparedHdr } : regularFiles;
  }
  const hasHdr = Boolean(preparedHdr);
  const objectNames = expectedPhotoObjectNames(photoType, hasHdr);
  assertPhotoObjectNames(
    "Prepared files",
    Object.keys(preparedFiles),
    photoType,
    hasHdr,
  );

  onProgress?.({ stage: "presigning", percent: 50 });
  const planResponse = await axios.post<Response<UploadPlan>>(
    `${API_ORIGIN}/uploads/presign`,
    buildPhotoPresignRequest(metadata, sourceDigest, photoType, hasHdr),
    { headers: authorizationHeader(token) },
  );
  const plan = planResponse.data.payload;
  assertPhotoObjectNames(
    "Upload plan objects",
    Object.keys(plan.objects),
    photoType,
    hasHdr,
  );
  const preparedByName = preparedFiles as Partial<Record<PhotoObjectName, PreparedPhotoVariant>>;
  const targets = objectNames.map((name) => {
    const target = plan.objects[name];
    if (!target) throw new Error(`Upload plan object is missing: ${name}`);
    return [name, target] as const;
  });

  for (const [index, [name, target]] of targets.entries()) {
    const prepared = preparedByName[name];
    if (!prepared) throw new Error(`Prepared file is missing: ${name}`);
    await putObject(target, prepared.blob);
    onProgress?.({
      stage: "uploading",
      percent: 55 + Math.round(((index + 1) / targets.length) * 35),
    });
  }

  onProgress?.({ stage: "completing", percent: 95 });
  const completeResponse = await axios.post<Response<Photo>>(
    `${API_ORIGIN}/uploads/complete`,
    buildPhotoCompleteRequest(
      photoType,
      plan.upload_token,
      source.name,
      preparedFiles,
      metadata,
      effectiveHdr?.name,
    ),
    { headers: authorizationHeader(token) },
  );
  onProgress?.({ stage: "completing", percent: 100 });
  return completeResponse.data.payload;
}
