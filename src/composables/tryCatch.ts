import { AxiosError } from "axios";

type Result<T, E = unknown> = [T, null] | [null, E];

export async function tryCatch<T, E = unknown>(
    promise: Promise<T>,
    ): Promise<Result<T, E>> {
    try {
        const data = await promise;
        if(data instanceof AxiosError && data.isAxiosError)
            throw data
        return [data, null];
    } catch (error) {
        return [null, error as E];
    }
}