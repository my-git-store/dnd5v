import axios, { type CreateAxiosDefaults } from "axios";

export type AccessTokenProvider = () => string | null | Promise<string | null>

export function useAxiosFactory(config: CreateAxiosDefaults, getAccessToken?: AccessTokenProvider) {
    const httpClient = axios.create(config)

    // Настройка axios: всегда добавлять токен к запросам
    httpClient.interceptors.request.use(async (config) => {
        const token = await getAccessToken?.();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });

    httpClient.interceptors.request.use(request => {
            console.log(`%c [${(request.method ?? 'unknown').toUpperCase()}] ${request.url}`, 'color: blue', request)
        return request
    })

    httpClient.interceptors.response.use(
        (response => {
            console.log(`%c [${(response.config.method ?? 'unknown').toUpperCase()}] ${response.config.url}`, 'color: green', response)
        return response
        }),
        (error => {
            console.log(`%c [${(error.config.method ?? 'unknown').toUpperCase()}] ${error.config.url}`, 'color: red', error)
            return Promise.reject(error)
        })
        )
    return httpClient
}
