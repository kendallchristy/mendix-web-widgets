import { echarts } from "@kendallchristy/chart-core";
import { renderHook, waitFor } from "@testing-library/react";

import { useMap } from "../components/useMap";

describe("useMap", () => {
    afterEach(() => {
        delete (globalThis as { fetch?: unknown }).fetch;
    });

    it("does nothing without a map", () => {
        expect(renderHook(() => useMap("", "")).result.current).toEqual({ loading: false, error: undefined });
    });

    it("loads and registers the GeoJSON once", async () => {
        const fetch = jest.fn(async () => ({ ok: true, json: async () => ({ type: "FeatureCollection" }) }));
        (globalThis as { fetch?: unknown }).fetch = fetch;
        const { result } = renderHook(() => useMap("world", "/world.json"));
        expect(result.current.loading).toBe(true);
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(echarts.getMap("world")).toBeDefined();
        expect(renderHook(() => useMap("world", "/world.json")).result.current.loading).toBe(false);
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("reports a map that doesn't load", async () => {
        (globalThis as { fetch?: unknown }).fetch = async () => ({ ok: false, status: 404, statusText: "Not Found" });
        const { result } = renderHook(() => useMap("moon", "/moon.json"));
        await waitFor(() => expect(result.current.error).toBe("The map at /moon.json didn't load: 404 Not Found"));
        expect(result.current.loading).toBe(false);
    });
});
