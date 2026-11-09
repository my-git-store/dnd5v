import { isAxiosError, type AxiosResponse } from "axios";
import { ref } from "vue";

import { useAlert } from "./useAlert";

export interface ApiError {
  status: number;
  code: string;
  message: string;
}

type RequestValue<T> = T | AxiosResponse<T>;
type Result<T> = [T, null] | [null, ApiError];

export function useReqDefault<T = unknown>(isSuccesAlert = false) {
  const { openError, openSucces } = useAlert();
  const isError = ref(false);
  const isLoading = ref(false);

  async function request(promise: Promise<RequestValue<T>>): Promise<Result<T>> {
    isError.value = false;
    isLoading.value = true;
    try {
      const response = await promise;
      const result = response && typeof response === "object" && "data" in response ? response.data : response;
      if (isSuccesAlert) openSucces();
      return [result as T, null];
    } catch (error: unknown) {
      isError.value = true;
      const message = isAxiosError(error)
        ? error.response?.data && typeof error.response.data === "object" && "message" in error.response.data
          ? String(error.response.data.message)
          : error.message
        : error instanceof Error
          ? error.message
          : "Неизвестная ошибка";
      openError(message);
      return [
        null,
        {
          status: isAxiosError(error) ? (error.response?.status ?? 500) : 500,
          code: "REQUEST_ERROR",
          message,
        },
      ];
    } finally {
      isLoading.value = false;
    }
  }

  return {
    isError,
    isLoading,
    request,
  };
}
