import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
} from "@heroui/react";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { TbMapPin } from "react-icons/tb";
import {
  ColorScheme,
  Map as AppleMap,
  MapType as AppleMapType,
  Marker as AppleMarker,
} from "mapkit-react";
import MapBox, { Marker as MapBoxMarker } from "react-map-gl/mapbox";
import { MapTokenContext, MapType } from "../contexts/map_token.tsx";
import useDarkMode from "../hooks/useDarkMode.ts";
import type { Coordinate } from "../models/gallery.ts";

const DEFAULT_CENTER: Coordinate = {
  latitude: 35.681236,
  longitude: 139.767125,
};

interface LocationPickerModalProps {
  isOpen: boolean;
  coordinate?: Coordinate;
  onClose: () => void;
  onConfirm: (coordinate: Coordinate) => void;
  onClear: () => void;
}

function coordinateKey(coordinate: Coordinate | undefined) {
  return coordinate ? `${coordinate.latitude}:${coordinate.longitude}` : "default";
}

export default function LocationPickerModal({
  isOpen,
  coordinate,
  onClose,
  onConfirm,
  onClear,
}: LocationPickerModalProps) {
  const { t } = useTranslation();
  const darkMode = useDarkMode();
  const mapToken = useContext(MapTokenContext)?.token;
  const [selectedCoordinate, setSelectedCoordinate] = useState<Coordinate>();

  useEffect(() => {
    if (isOpen) setSelectedCoordinate(coordinate);
  }, [coordinate, isOpen]);

  const initialCenter = coordinate ?? DEFAULT_CENTER;
  const applyCoordinate = (nextCoordinate: Coordinate) => {
    setSelectedCoordinate({
      latitude: nextCoordinate.latitude,
      longitude: nextCoordinate.longitude,
    });
  };

  const map = !mapToken ? (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-default-100 text-default-500">
      <Spinner size="sm"/>
      <p className="text-small">{t("upload.location.map_loading")}</p>
    </div>
  ) : mapToken.type === MapType.Apple ? (
    <AppleMap
      key={coordinateKey(coordinate)}
      token={mapToken.token}
      allowWheelToZoom
      initialRegion={{
        centerLatitude: initialCenter.latitude,
        centerLongitude: initialCenter.longitude,
        latitudeDelta: coordinate ? 0.03 : 18,
        longitudeDelta: coordinate ? 0.03 : 18,
      }}
      colorScheme={darkMode.value ? ColorScheme.Dark : ColorScheme.Light}
      mapType={AppleMapType.MutedStandard}
      showsZoomControl
      onSingleTap={(event) => applyCoordinate(event.toCoordinates())}
    >
      {selectedCoordinate ? (
        <AppleMarker
          latitude={selectedCoordinate.latitude}
          longitude={selectedCoordinate.longitude}
          color="#f31260"
          draggable
          onDragging={applyCoordinate}
          onDragEnd={applyCoordinate}
        />
      ) : null}
    </AppleMap>
  ) : mapToken.type === MapType.MapBox ? (
    <MapBox
      key={coordinateKey(coordinate)}
      mapboxAccessToken={mapToken.token}
      initialViewState={{
        longitude: initialCenter.longitude,
        latitude: initialCenter.latitude,
        zoom: coordinate ? 13 : 4,
      }}
      style={{ width: "100%", height: "100%" }}
      mapStyle={darkMode.value ? "mapbox://styles/mapbox/dark-v11" : "mapbox://styles/mapbox/streets-v12"}
      onClick={(event) => applyCoordinate({
        latitude: event.lngLat.lat,
        longitude: event.lngLat.lng,
      })}
    >
      {selectedCoordinate ? (
        <MapBoxMarker
          latitude={selectedCoordinate.latitude}
          longitude={selectedCoordinate.longitude}
          color="#f31260"
          draggable
          onDragEnd={(event) => applyCoordinate({
            latitude: event.lngLat.lat,
            longitude: event.lngLat.lng,
          })}
        />
      ) : null}
    </MapBox>
  ) : (
    <div className="flex h-full items-center justify-center bg-default-100 px-6 text-center text-small text-default-500">
      {t("upload.location.map_unavailable")}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      size="3xl"
      scrollBehavior="inside"
      placement="center"
      classNames={{ base: "mx-3 sm:mx-6" }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col items-start gap-1 pb-3">
          <div className="flex items-center gap-2">
            <TbMapPin className="text-primary" size={22}/>
            <span>{t("upload.location.map_title")}</span>
          </div>
          <p className="text-small font-normal text-default-500">
            {t("upload.location.map_description")}
          </p>
        </ModalHeader>
        <ModalBody className="gap-3 px-4 sm:px-6">
          <div
            className="relative h-[58dvh] min-h-80 max-h-[620px] overflow-hidden rounded-xl bg-default-100"
            aria-label={t("upload.location.map_title")}
          >
            {map}
            <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 whitespace-nowrap rounded-full bg-background/85 px-3 py-1.5 text-tiny font-medium shadow-small backdrop-blur-md">
              {t("upload.location.map_hint")}
            </div>
          </div>
          <div className="flex min-h-8 flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-default-100 px-3 py-2 text-small">
            {selectedCoordinate ? (
              <>
                <span className="font-medium">{t("upload.location.selected")}</span>
                <code className="text-default-500">
                  {selectedCoordinate.latitude.toFixed(6)}, {selectedCoordinate.longitude.toFixed(6)}
                </code>
              </>
            ) : (
              <span className="text-default-500">{t("upload.location.not_selected")}</span>
            )}
          </div>
        </ModalBody>
        <ModalFooter className="flex-wrap">
          {coordinate ? (
            <Button
              className="mr-auto"
              color="danger"
              variant="light"
              onPress={() => {
                onClear();
                onClose();
              }}
            >
              {t("upload.location.clear")}
            </Button>
          ) : <span className="mr-auto"/>}
          <Button variant="light" onPress={onClose}>{t("auth.cancel")}</Button>
          <Button
            color="primary"
            isDisabled={!selectedCoordinate}
            onPress={() => {
              if (!selectedCoordinate) return;
              onConfirm(selectedCoordinate);
              onClose();
            }}
          >
            {t("upload.location.apply")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
