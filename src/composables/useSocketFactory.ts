import { Manager } from "socket.io-client";

const manager = new Manager(import.meta.env.VITE_APP_API, {
    autoConnect: false,
});

export function useSocketFactory(path: string = '/') {
    return manager.socket(path);
}