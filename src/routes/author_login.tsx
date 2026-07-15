import { FormEvent, useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import axios from "axios";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import { TbEye, TbEyeOff, TbLock, TbUser } from "react-icons/tb";
import Index from "./index.tsx";
import useAuth from "../hooks/useAuth.ts";
import { LoginResponse, Response } from "../models/gallery.ts";

const LOGIN_URL = "https://api.gallery.boar.ac.cn/auth/login";

export default function AuthorLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const { isAuthenticated, login } = useAuth();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const requestedDestination = searchParams.get("next");
  const destination = requestedDestination?.startsWith("/") && !requestedDestination.startsWith("//")
    ? requestedDestination
    : "/";
  const close = useCallback(() => navigate("/", { replace: true }), [navigate]);
  const finish = useCallback(() => navigate(destination, { replace: true }), [destination, navigate]);

  useEffect(() => {
    if (isAuthenticated) finish();
  }, [finish, isAuthenticated]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !password || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await axios.post<Response<LoginResponse>>(LOGIN_URL, {
        name: name.trim(),
        password,
      });
      login(response.data.payload);
      finish();
    } catch (error) {
      if (axios.isAxiosError<Response<string>>(error)) {
        if (error.response?.status === 401) {
          setErrorMessage(t("auth.error.invalid_credentials"));
        } else if (error.response?.status === 429) {
          setErrorMessage(t("auth.error.too_many_attempts"));
        } else {
          setErrorMessage(t("auth.error.unavailable"));
        }
      } else {
        setErrorMessage(t("auth.error.unavailable"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Index/>
      <Modal
        isOpen={!isAuthenticated}
        onOpenChange={(isOpen) => {
          if (!isOpen && !isSubmitting) close();
        }}
        isDismissable={!isSubmitting}
        isKeyboardDismissDisabled={isSubmitting}
        placement="center"
        backdrop="blur"
        classNames={{ base: "mx-4" }}
      >
        <ModalContent>
          <form onSubmit={handleSubmit}>
            <ModalHeader className="flex flex-col items-start gap-1 pb-2">
              <span className="text-logo text-3xl">Boar Gallery</span>
              <span className="text-small font-normal text-default-500">
                {t("auth.description")}
              </span>
            </ModalHeader>
            <ModalBody className="gap-4 py-4">
              <Input
                autoFocus
                isRequired
                isDisabled={isSubmitting}
                name="name"
                label={t("auth.name")}
                autoComplete="username"
                value={name}
                onValueChange={setName}
                variant="bordered"
                startContent={<TbUser className="shrink-0 text-default-400" size={20}/>}
              />
              <Input
                isRequired
                isDisabled={isSubmitting}
                name="password"
                label={t("auth.password")}
                type={isPasswordVisible ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onValueChange={setPassword}
                variant="bordered"
                startContent={<TbLock className="shrink-0 text-default-400" size={20}/>}
                endContent={
                  <Button
                    isIconOnly
                    type="button"
                    size="sm"
                    variant="light"
                    className="-mr-2 text-default-400"
                    aria-label={t(isPasswordVisible ? "auth.hide_password" : "auth.show_password")}
                    onPress={() => setIsPasswordVisible((visible) => !visible)}
                  >
                    {isPasswordVisible ? <TbEyeOff size={19}/> : <TbEye size={19}/>}
                  </Button>
                }
              />
              {errorMessage ? (
                <p className="text-small text-danger" role="alert">{errorMessage}</p>
              ) : null}
            </ModalBody>
            <ModalFooter>
              <Button
                type="button"
                variant="light"
                isDisabled={isSubmitting}
                onPress={close}
              >
                {t("auth.cancel")}
              </Button>
              <Button color="primary" type="submit" isLoading={isSubmitting}>
                {t("auth.login")}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </>
  );
}
