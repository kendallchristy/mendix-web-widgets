import { useLayoutEffect, useState } from "react";

import { ListController, type ListOptions } from "../engine/ListController";

/**
 * Creates the drag engine for one list and keeps its options current. Options are read when a drag happens, so
 * passing new callbacks on every render is fine.
 */
export function useListController(id: string, options: ListOptions): ListController {
    const [controller] = useState(() => new ListController(id, options));
    useLayoutEffect(() => {
        controller.attach();
        return () => controller.destroy();
    }, [controller]);
    useLayoutEffect(() => {
        controller.setOptions(options);
        controller.syncIndexes();
    });
    return controller;
}
