import { echarts } from "@kendallchristy/chart-core";
import { useEffect, useState } from "react";

export interface MapState {
    loading: boolean;
    error?: string;
}

// Each map is fetched once per page, however many charts use it.
const requests = new Map<string, Promise<void>>();

function registerMap(name: string, url: string): Promise<void> {
    const key = `${name}\n${url}`;
    let request = requests.get(key);
    if (!request) {
        request = fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`${response.status} ${response.statusText}`.trim());
                }
                return response.json();
            })
            .then(geoJson => {
                echarts.registerMap(name, geoJson);
            });
        // A failed request can be tried again, for example after the file is added.
        request.catch(() => requests.delete(key));
        requests.set(key, request);
    }
    return request;
}

/** Loads and registers a GeoJSON map before the chart draws, when the widget names one. */
export function useMap(name: string, url: string): MapState {
    const mapName = name.trim();
    const mapUrl = url.trim();
    const key = mapName && mapUrl ? `${mapName}\n${mapUrl}` : "";
    // How the latest request for a map ended, so a different map doesn't show an old map's error.
    const [settled, setSettled] = useState<{ key: string; error?: string }>();
    useEffect(() => {
        if (!key || echarts.getMap(mapName)) {
            return;
        }
        let current = true;
        registerMap(mapName, mapUrl).then(
            () => {
                if (current) {
                    setSettled({ key });
                }
            },
            (e: unknown) => {
                if (current) {
                    setSettled({
                        key,
                        error: `The map at ${mapUrl} didn't load: ${e instanceof Error ? e.message : String(e)}`
                    });
                }
            }
        );
        return () => {
            current = false;
        };
    }, [key, mapName, mapUrl]);
    const done = settled?.key === key;
    return {
        loading: Boolean(key) && !done && !echarts.getMap(mapName),
        error: done ? settled.error : undefined
    };
}
