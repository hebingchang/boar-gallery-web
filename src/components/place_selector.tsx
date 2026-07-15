import axios from "axios";
import {
  Autocomplete,
  AutocompleteItem,
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import { Key, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { TbMapPin, TbPlus, TbSearch } from "react-icons/tb";
import type { Coordinate, Place, Response } from "../models/gallery.ts";
import { createPlace, queryPlaces } from "../services/place.ts";
import LocationPickerModal from "./location_picker_modal.tsx";

interface PlaceSelectorProps {
  value?: Place;
  token: string;
  coordinate?: Coordinate;
  isDisabled?: boolean;
  onChange: (place?: Place) => void;
  onUnauthorized: () => void;
}

interface PlaceDraft {
  name: string;
  latitude: string;
  longitude: string;
}

const EMPTY_DRAFT: PlaceDraft = {
  name: "",
  latitude: "",
  longitude: "",
};

function placeDescription(place: Place) {
  const region = [
    place.city?.name,
    place.city?.prefecture?.name,
    place.city?.prefecture?.country?.name,
  ].filter((part): part is string => Boolean(part));
  if (region.length > 0) return region.join(" · ");
  if (place.geom) return `${place.geom.latitude.toFixed(5)}, ${place.geom.longitude.toFixed(5)}`;
  return "";
}

function coordinateFromDraft(draft: PlaceDraft): Coordinate | undefined {
  if (!draft.latitude.trim() || !draft.longitude.trim()) return undefined;
  const latitude = Number(draft.latitude);
  const longitude = Number(draft.longitude);
  if (
    !Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
    !Number.isFinite(longitude) || longitude < -180 || longitude > 180
  ) return undefined;
  return { latitude, longitude };
}

export default function PlaceSelector({
  value,
  token,
  coordinate,
  isDisabled = false,
  onChange,
  onUnauthorized,
}: PlaceSelectorProps) {
  const { t } = useTranslation();
  const [places, setPlaces] = useState<Place[]>(value ? [value] : []);
  const [inputValue, setInputValue] = useState(value?.name ?? "");
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryError, setQueryError] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [draft, setDraft] = useState<PlaceDraft>(EMPTY_DRAFT);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const preserveInputOnClearRef = useRef(false);

  useEffect(() => {
    if (!value) {
      if (preserveInputOnClearRef.current) {
        preserveInputOnClearRef.current = false;
        return;
      }
      setInputValue("");
      return;
    }
    preserveInputOnClearRef.current = false;
    setInputValue(value.name);
    setPlaces((current) => current.some((place) => place.id === value.id)
      ? current
      : [value, ...current]);
  }, [value]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeoutId = window.setTimeout(() => {
      setIsQuerying(true);
      setQueryError("");
      void queryPlaces(inputValue, controller.signal)
        .then((results) => {
          if (!active) return;
          setPlaces(value && !results.some((place) => place.id === value.id)
            ? [value, ...results]
            : results);
        })
        .catch((error: unknown) => {
          if (!active || axios.isCancel(error)) return;
          setQueryError(t("upload.place.error.query"));
        })
        .finally(() => {
          if (active) setIsQuerying(false);
        });
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [inputValue, t, value]);

  const draftCoordinate = coordinateFromDraft(draft);
  const openCreateModal = () => {
    setDraft({
      name: value ? "" : inputValue.trim(),
      latitude: coordinate ? coordinate.latitude.toFixed(6) : "",
      longitude: coordinate ? coordinate.longitude.toFixed(6) : "",
    });
    setCreateError("");
    setIsCreateOpen(true);
  };

  const handleSelectionChange = (key: Key | null) => {
    if (key === null) {
      onChange(undefined);
      return;
    }
    const selected = places.find((place) => place.id === Number(key));
    if (!selected) return;
    setInputValue(selected.name);
    onChange(selected);
  };

  const handleCreate = async () => {
    const name = draft.name.trim();
    const geom = coordinateFromDraft(draft);
    if (!name || !geom) {
      setCreateError(t("upload.place.error.invalid"));
      return;
    }

    setIsCreating(true);
    setCreateError("");
    try {
      const created = await createPlace(name, geom, token);
      setPlaces((current) => [created, ...current.filter((place) => place.id !== created.id)]);
      setInputValue(created.name);
      onChange(created);
      setIsCreateOpen(false);
    } catch (error) {
      if (axios.isAxiosError<Response<string>>(error)) {
        if (error.response?.status === 401) {
          setIsCreateOpen(false);
          onUnauthorized();
          return;
        }
        if (error.response?.status === 409) {
          setCreateError(t("upload.place.error.duplicate"));
          return;
        }
        const message = error.response?.data?.payload;
        setCreateError(
          error.response?.status === 400 && typeof message === "string"
            ? t("upload.place.error.rejected", { message })
            : t("upload.place.error.create"),
        );
      } else {
        setCreateError(t("upload.place.error.create"));
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
        <Autocomplete
          isClearable
          isDisabled={isDisabled}
          isLoading={isQuerying}
          label={t("upload.place.label")}
          labelPlacement="outside"
          placeholder={t("upload.place.placeholder")}
          description={t("upload.place.description")}
          variant="bordered"
          items={places}
          inputValue={inputValue}
          selectedKey={value?.id ?? null}
          startContent={<TbSearch className="shrink-0 text-default-400" size={18}/>}
          onInputChange={(nextValue) => {
            setInputValue(nextValue);
            setQueryError("");
            if (value && nextValue !== value.name) {
              preserveInputOnClearRef.current = true;
              onChange(undefined);
            }
          }}
          onSelectionChange={handleSelectionChange}
          onClear={() => onChange(undefined)}
          listboxProps={{ emptyContent: t("upload.place.no_results") }}
        >
          {(place) => (
            <AutocompleteItem key={place.id} textValue={place.name}>
              <div className="py-1">
                <p className="font-medium">{place.name}</p>
                {placeDescription(place) ? (
                  <p className="text-tiny text-default-500">{placeDescription(place)}</p>
                ) : null}
              </div>
            </AutocompleteItem>
          )}
        </Autocomplete>
        <Button
          className="sm:mt-6"
          variant="bordered"
          isDisabled={isDisabled}
          startContent={<TbPlus size={18}/>}
          onPress={openCreateModal}
        >
          {t("upload.place.create")}
        </Button>
      </div>
      {queryError ? <p className="mt-2 text-small text-danger" role="alert">{queryError}</p> : null}

      <Modal
        isOpen={isCreateOpen}
        onOpenChange={(open) => {
          if (!isCreating) setIsCreateOpen(open);
        }}
        isDismissable={!isCreating}
        isKeyboardDismissDisabled={isCreating}
        placement="center"
        classNames={{ base: "mx-4" }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col items-start gap-1 pb-2">
            <span>{t("upload.place.create_title")}</span>
            <span className="text-small font-normal text-default-500">
              {t("upload.place.create_description")}
            </span>
          </ModalHeader>
          <ModalBody className="gap-4 py-4">
            <Input
              autoFocus
              isRequired
              isDisabled={isCreating}
              label={t("upload.place.name")}
              variant="bordered"
              value={draft.name}
              onValueChange={(name) => setDraft((current) => ({ ...current, name }))}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                isRequired
                isDisabled={isCreating}
                type="number"
                min="-90"
                max="90"
                step="any"
                label={t("upload.field.latitude")}
                variant="bordered"
                value={draft.latitude}
                onValueChange={(latitude) => setDraft((current) => ({ ...current, latitude }))}
              />
              <Input
                isRequired
                isDisabled={isCreating}
                type="number"
                min="-180"
                max="180"
                step="any"
                label={t("upload.field.longitude")}
                variant="bordered"
                value={draft.longitude}
                onValueChange={(longitude) => setDraft((current) => ({ ...current, longitude }))}
              />
            </div>
            <Button
              className="dark:data-[disabled=true]:text-default-600 dark:data-[disabled=true]:opacity-70"
              variant="flat"
              color="primary"
              isDisabled={isCreating}
              startContent={<TbMapPin size={18}/>}
              onPress={() => {
                setIsCreateOpen(false);
                setIsMapOpen(true);
              }}
            >
              {t("upload.location.choose_on_map")}
            </Button>
            {draftCoordinate ? (
              <p className="text-small text-default-500">
                {t("upload.place.coordinate", {
                  latitude: draftCoordinate.latitude.toFixed(6),
                  longitude: draftCoordinate.longitude.toFixed(6),
                })}
              </p>
            ) : null}
            {createError ? <p className="text-small text-danger" role="alert">{createError}</p> : null}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              isDisabled={isCreating}
              onPress={() => setIsCreateOpen(false)}
            >
              {t("auth.cancel")}
            </Button>
            <Button
              color="primary"
              isLoading={isCreating}
              isDisabled={!draft.name.trim() || !draftCoordinate}
              onPress={() => void handleCreate()}
            >
              {t("upload.place.create_action")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <LocationPickerModal
        isOpen={isMapOpen}
        coordinate={draftCoordinate}
        onClose={() => {
          setIsMapOpen(false);
          setIsCreateOpen(true);
        }}
        onConfirm={(nextCoordinate) => setDraft((current) => ({
          ...current,
          latitude: nextCoordinate.latitude.toFixed(6),
          longitude: nextCoordinate.longitude.toFixed(6),
        }))}
        onClear={() => setDraft((current) => ({
          ...current,
          latitude: "",
          longitude: "",
        }))}
      />
    </>
  );
}
