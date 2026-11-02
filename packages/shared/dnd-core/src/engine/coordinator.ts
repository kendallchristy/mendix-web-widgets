import { monitorForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { extractClosestEdge } from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import type { DragLocationHistory, DropTargetRecord } from "@atlaskit/pragmatic-drag-and-drop/types";

import { announce } from "./announcer";
import { autoScroller } from "./autoScroll";
import { prepareLists, settleLists } from "./batch";
import { insertionIndex } from "./geometry";
import type { ListController } from "./ListController";
import { isItemData, type Box, type DragItemData, type DropResult } from "./types";

interface DragState {
    data: DragItemData;
    source: ListController;
    target: ListController | undefined;
    index: number | undefined;
    keyboard: boolean;
    /** Where the pointer grabbed the item, from its top left corner. */
    grab: { x: number; y: number };
}

/**
 * Connects every list on the page: one Pragmatic drag and drop monitor sees each drag, works out which list and
 * index it is over, and tells the lists involved what to show. Drops are handled here too, so all lists record
 * their positions before any of them re-renders and the move animates as one.
 */
class Coordinator {
    private lists = new Map<string, ListController>();
    private cleanup: (() => void) | undefined;
    private state: DragState | undefined;

    get keyboardActive(): boolean {
        return this.state?.keyboard === true;
    }

    register(list: ListController): void {
        this.lists.set(list.id, list);
        if (!this.cleanup) {
            this.cleanup = monitorForElements({
                canMonitor: ({ source }) => isItemData(source.data),
                onDragStart: ({ source, location }) => this.pointerStart(source.data as DragItemData, location),
                onDrag: ({ location }) => this.pointerMove(location),
                onDropTargetChange: ({ location }) => this.pointerMove(location),
                onDrop: ({ location }) => this.pointerDrop(location)
            });
        }
    }

    unregister(list: ListController): void {
        if (this.lists.get(list.id) === list) {
            this.lists.delete(list.id);
        }
        if (this.lists.size === 0) {
            this.cleanup?.();
            this.cleanup = undefined;
        }
    }

    get(id: string): ListController | undefined {
        return this.lists.get(id);
    }

    private inScope(scope: string): ListController[] {
        return Array.from(this.lists.values()).filter(list => list.options.scope === scope);
    }

    // ---- pointer drags ---------------------------------------------------------------------------------------------

    private pointerStart(data: DragItemData, location: DragLocationHistory): void {
        const source = this.lists.get(data.listId);
        if (!source) {
            return;
        }
        const rect = source.innerRect(data.itemId);
        this.state = {
            data,
            source,
            target: source,
            index: data.index,
            keyboard: false,
            grab: rect
                ? { x: location.initial.input.clientX - rect.left, y: location.initial.input.clientY - rect.top }
                : { x: data.width / 2, y: data.height / 2 }
        };
        prepareLists(this.inScope(data.scope));
        this.showAll();
        source.options.onDragStart?.(data.itemId);
    }

    private resolve(dropTargets: DropTargetRecord[]): { list: ListController; index: number } | undefined {
        const state = this.state!;
        const { data } = state;
        for (const record of dropTargets) {
            const target = record.data;
            if (target.scope !== data.scope) {
                continue;
            }
            const list = this.lists.get(target.listId as string);
            if (!list) {
                continue;
            }
            const sameList = list.id === data.listId;
            if (!sameList && !list.options.canReceive(data)) {
                return undefined;
            }
            if (target.kdnd === "slot") {
                const edge = extractClosestEdge(target);
                const after = edge === "bottom" || edge === "right";
                return {
                    list,
                    index: insertionIndex(target.index as number, after, sameList ? data.index : undefined)
                };
            }
            if (target.kdnd === "list") {
                return { list, index: Math.max(0, list.count() - (sameList ? 1 : 0)) };
            }
        }
        return undefined;
    }

    private pointerMove(location: DragLocationHistory): void {
        const state = this.state;
        if (!state || state.keyboard) {
            return;
        }
        autoScroller.move(location.current.input.clientX, location.current.input.clientY);
        const next = this.resolve(location.current.dropTargets);
        if (next?.list === state.target && next?.index === state.index) {
            return;
        }
        state.target = next?.list;
        state.index = next?.index;
        this.showAll();
    }

    /** Tells every list in the drag's scope what to show for the current state. */
    private showAll(): void {
        const state = this.state;
        if (!state) {
            return;
        }
        const { data, source, target, index, keyboard } = state;
        this.inScope(data.scope).forEach(list => {
            const isSource = list === source;
            const isTarget = list === target;
            list.show({
                source: isSource ? data : undefined,
                incoming: !isSource && isTarget ? data : undefined,
                target: isTarget ? index : undefined,
                keyboard
            });
        });
    }

    private pointerDrop(location: DragLocationHistory): void {
        const state = this.state;
        if (!state || state.keyboard) {
            return;
        }
        const final = this.resolve(location.current.dropTargets);
        state.target = final?.list;
        state.index = final?.index;
        const input = location.current.input;
        this.finish({
            x: input.clientX - state.grab.x,
            y: input.clientY - state.grab.y,
            width: state.data.width,
            height: state.data.height
        });
    }

    /** Completes the move: records positions, lets the widgets change the order, then animates into place. */
    private finish(fromRect: Box | undefined): void {
        const state = this.state!;
        this.state = undefined;
        autoScroller.stop();
        const { data, source, target, index, keyboard } = state;
        const involved = this.inScope(data.scope);

        if (!target || index === undefined) {
            settleLists(involved.map(list => ({ list })));
            announce(source.options.describe("cancelled", data.itemId, data.index + 1, source.count()));
            if (keyboard) {
                source.focusItem(data.itemId);
            }
            return;
        }

        const firsts = new Map(involved.map(list => [list.id, list.captureRects()]));
        const startRect: Box | undefined =
            fromRect ??
            (() => {
                const rect = target === source ? source.innerRect(data.itemId) : target.placeholderRect();
                return rect && { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
            })();

        const result: DropResult = {
            itemId: data.itemId,
            fromListId: source.id,
            toListId: target.id,
            fromIndex: data.index,
            toIndex: index,
            via: keyboard ? "keyboard" : "pointer"
        };
        try {
            target.options.onDrop(result);
            if (target !== source) {
                source.options.onRemove?.(result);
            }
        } catch (error) {
            console.error("Drag and drop: the drop could not be saved.", error);
        }

        settleLists(
            involved.map(list => ({
                list,
                first: firsts.get(list.id),
                override: list === target && startRect ? { id: data.itemId, rect: startRect } : undefined
            }))
        );
        const count = target.count();
        announce(target.options.describe("dropped", data.itemId, index + 1, count));
        if (keyboard) {
            target.focusItem(data.itemId);
        }
    }

    // ---- keyboard --------------------------------------------------------------------------------------------------

    /** Handles a key on an item. Returns true when the key was used. */
    handleKey(list: ListController, id: string, key: string): boolean {
        const state = this.state;
        if (!state) {
            if (!(list.options.liftKeys ?? [" ", "Enter"]).includes(key)) {
                return false;
            }
            if (!list.options.canDragItem(id)) {
                return false;
            }
            const index = list.indexOf(id);
            const rect = list.innerRect(id);
            if (index < 0 || !rect) {
                return false;
            }
            const data: DragItemData = {
                kdnd: "item",
                scope: list.options.scope,
                listId: list.id,
                itemId: id,
                index,
                width: rect.width,
                height: rect.height
            };
            this.state = { data, source: list, target: list, index, keyboard: true, grab: { x: 0, y: 0 } };
            prepareLists(this.inScope(data.scope));
            this.showAll();
            list.options.onDragStart?.(id);
            announce(list.options.describe("lifted", id, index + 1, list.count()));
            return true;
        }
        if (!state.keyboard) {
            return false;
        }

        switch (key) {
            case "Escape":
            case "Tab":
                state.target = undefined;
                state.index = undefined;
                this.finish(undefined);
                return key === "Escape";
            case " ":
            case "Enter":
                this.finish(undefined);
                return true;
            case "ArrowUp":
            case "ArrowDown":
            case "ArrowLeft":
            case "ArrowRight":
                this.keyboardMove(key);
                return true;
            default:
                return false;
        }
    }

    private keyboardMove(key: "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight"): void {
        const state = this.state!;
        const target = state.target ?? state.source;
        const axis = target.options.axis;
        const along =
            axis === "vertical"
                ? { ArrowUp: -1, ArrowDown: 1 }
                : axis === "horizontal"
                  ? { ArrowLeft: -1, ArrowRight: 1 }
                  : {
                        ArrowLeft: -1,
                        ArrowRight: 1,
                        ArrowUp: -target.gridColumns(),
                        ArrowDown: target.gridColumns()
                    };
        const step = (along as Record<string, number | undefined>)[key];
        const max = (list: ListController): number => list.count() - (list === state.source ? 1 : 0);

        if (step !== undefined) {
            const index = Math.max(0, Math.min((state.index ?? 0) + step, max(target)));
            if (index === state.index) {
                return;
            }
            state.target = target;
            state.index = index;
        } else {
            const direction = key === "ArrowLeft" || key === "ArrowUp" ? "previous" : "next";
            const neighbourId = target.options.neighbour?.(direction);
            const neighbour = neighbourId ? this.lists.get(neighbourId) : undefined;
            if (!neighbour || (neighbour !== state.source && !neighbour.options.canReceive(state.data))) {
                return;
            }
            neighbour.prepare();
            state.target = neighbour;
            state.index = Math.min(state.index ?? 0, max(neighbour));
        }
        this.showAll();
        const list = state.target!;
        list.reveal();
        const count = list.count() + (list === state.source ? 0 : 1);
        announce(list.options.describe("moved", state.data.itemId, state.index! + 1, count));
    }
}

export const coordinator = new Coordinator();
