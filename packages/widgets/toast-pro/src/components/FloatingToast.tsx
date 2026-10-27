import classNames from "classnames";
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
    useSyncExternalStore,
    type CSSProperties,
    type KeyboardEvent,
    type MouseEvent,
    type PointerEvent,
    type ReactElement,
    type ReactNode
} from "react";
import { createPortal } from "react-dom";

import { Countdown, type PauseReason } from "../core/countdown";
import { toastStack } from "../core/stack";
import { fillSeconds, hasSecondsToken } from "../core/text";
import type { CloseReason, Phase, Position, Variant } from "../core/types";
import { getViewport } from "../core/viewport";
import { ToastContent, type ToastButton } from "./ToastContent";

export type Animation = "slide" | "fade" | "scale";

export interface FloatingToastProps {
    id: string;
    phase: Phase;
    generation: number;
    variant: Variant;
    busy: boolean;
    /** Texts may hold [seconds]; it is filled in here. */
    title?: string;
    message?: string;
    icon?: ReactNode | null;
    customContent?: ReactNode;
    replaceText: boolean;
    buttons: ToastButton[];
    closeLabel?: string;
    /** Milliseconds; undefined stays open until closed. */
    duration?: number;
    pauseOnHover: boolean;
    pauseWhenHidden: boolean;
    showProgress: boolean;
    position: Position;
    alwaysExpanded: boolean;
    maxVisible: number;
    width: number;
    groupKey?: string;
    colored: boolean;
    animation: Animation;
    swipeToDismiss: boolean;
    dark: boolean;
    clickable: boolean;
    className?: string;
    style?: CSSProperties;
    onClose(reason: CloseReason): void;
    onToastClick(): void;
}

const SWIPE_DISTANCE = 80;
const noSubscription = (): (() => void) => () => undefined;
const notRunning = (): boolean => false;
const interactive = "button, a, input, select, textarea, label, [role='button'], [contenteditable='true']";

function usePageHidden(): boolean {
    const [hidden, setHidden] = useState(() => document.visibilityState === "hidden");
    useEffect(() => {
        const update = (): void => setHidden(document.visibilityState === "hidden");
        document.addEventListener("visibilitychange", update);
        return () => {
            document.removeEventListener("visibilitychange", update);
        };
    }, []);
    return hidden;
}

export function FloatingToast(props: FloatingToastProps): ReactElement {
    const { id, phase, generation, position, duration, busy } = props;
    const stack = toastStack;

    const onCloseRef = useRef(props.onClose);
    useLayoutEffect(() => {
        onCloseRef.current = props.onClose;
    });

    // Stack membership: in the stack while shown, frozen in place while animating out.
    useSyncExternalStore(stack.subscribe, stack.getVersion);
    const layout = stack.layout(id);
    const heightRef = useRef(0);
    const shown = phase === "open" || phase === "closing";
    useEffect(() => {
        if (!shown) {
            return undefined;
        }
        stack.add(
            {
                id,
                position,
                groupKey: props.groupKey || undefined,
                alwaysExpanded: props.alwaysExpanded,
                maxVisible: props.maxVisible,
                width: props.width,
                onReplaced: () => onCloseRef.current("Replaced")
            },
            heightRef.current
        );
        return undefined;
    }, [shown, generation, stack, id, position, props.groupKey, props.alwaysExpanded, props.maxVisible, props.width]);
    useEffect(() => {
        if (phase === "exiting") {
            stack.leave(id);
        }
    }, [phase, stack, id]);
    useEffect(() => {
        return () => {
            stack.remove(id);
        };
    }, [stack, id]);

    // Height, measured on the inner box so a toast tucked behind the stack still reports its own height.
    const innerRef = useRef<HTMLDivElement>(null);
    useLayoutEffect(() => {
        const inner = innerRef.current;
        if (!inner) {
            return undefined;
        }
        const measure = (): void => {
            heightRef.current = inner.offsetHeight;
            stack.setHeight(id, inner.offsetHeight);
        };
        measure();
        if (typeof ResizeObserver === "undefined") {
            return undefined;
        }
        const observer = new ResizeObserver(measure);
        observer.observe(inner);
        return () => {
            observer.disconnect();
        };
    }, [stack, id]);

    // Countdown, restarted for each show and when Busy ends.
    const [focused, setFocused] = useState(false);
    const pageHidden = usePageHidden();
    const pauses: Record<PauseReason, boolean> = {
        hover: props.pauseOnHover && !!layout?.hovered,
        focus: props.pauseOnHover && focused,
        hidden: props.pauseWhenHidden && pageHidden,
        queued: !!layout?.queued
    };
    const pausesRef = useRef(pauses);
    useLayoutEffect(() => {
        pausesRef.current = pauses;
    });
    const counting = phase === "open" && !busy && duration !== undefined;
    // Building a Countdown starts nothing; the effect below starts and stops it.
    const countdown = useMemo(
        () => (counting && duration !== undefined ? new Countdown(duration) : undefined),
        // generation restarts the countdown when the toast is triggered again while open.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [counting, duration, generation]
    );
    const running = useSyncExternalStore(countdown?.subscribe ?? noSubscription, countdown?.isRunning ?? notRunning);
    useEffect(() => {
        if (!countdown) {
            return undefined;
        }
        countdown.start(
            () => onCloseRef.current("Timeout"),
            Object.entries(pausesRef.current)
                .filter(([, paused]) => paused)
                .map(([reason]) => reason as PauseReason)
        );
        return () => {
            countdown.stop();
        };
    }, [countdown]);
    useEffect(() => {
        countdown?.setPaused("hover", pauses.hover);
        countdown?.setPaused("focus", pauses.focus);
        countdown?.setPaused("hidden", pauses.hidden);
        countdown?.setPaused("queued", pauses.queued);
    }, [countdown, pauses.hover, pauses.focus, pauses.hidden, pauses.queued]);

    // The bar shrinks with a CSS transition per running stretch and freezes where it is on pause.
    const barRef = useRef<HTMLDivElement>(null);
    useLayoutEffect(() => {
        const bar = barRef.current;
        if (!bar) {
            return;
        }
        const total = countdown?.duration ?? 1;
        const left = countdown ? countdown.remaining() : total;
        bar.style.transition = "none";
        bar.style.transform = `scaleX(${left / total})`;
        if (running && countdown) {
            void bar.offsetWidth;
            bar.style.transition = `transform ${left}ms linear`;
            bar.style.transform = "scaleX(0)";
        }
    }, [running, countdown]);

    // [seconds] in a text needs a re-render each second while the countdown runs.
    const texts = [props.title, props.message, ...props.buttons.map(button => button.caption)];
    const ticking = running && texts.some(hasSecondsToken);
    const subscribeTick = useCallback(
        (onTick: () => void) => {
            if (!ticking) {
                return () => undefined;
            }
            const timer = setInterval(onTick, 250);
            return () => {
                clearInterval(timer);
            };
        },
        [ticking]
    );
    const secondsLeft = useSyncExternalStore(subscribeTick, () =>
        countdown ? Math.ceil(countdown.remaining() / 1000) : undefined
    );
    // Busy hasn't started counting; once closing, the time is up.
    const msLeft = busy ? duration : secondsLeft !== undefined ? secondsLeft * 1000 : phase === "open" ? duration : 0;
    const fill = (text: string | undefined): string | undefined =>
        text === undefined ? undefined : fillSeconds(text, msLeft);

    // Enter animation: render once in the start state, then switch to open on the next frame.
    const [entered, setEntered] = useState(false);
    useEffect(() => {
        if (!shown || entered) {
            return undefined;
        }
        const frame = requestAnimationFrame(() => setEntered(true));
        return () => {
            cancelAnimationFrame(frame);
        };
    }, [shown, entered]);

    // Swipe to dismiss.
    const [swipe, setSwipe] = useState(0);
    const [swipedOut, setSwipedOut] = useState(0);
    const drag = useRef<{ x: number; moved: boolean } | undefined>(undefined);
    const suppressClick = useRef(false);
    const onPointerDown = (event: PointerEvent<HTMLDivElement>): void => {
        if (!props.swipeToDismiss || event.button !== 0 || phase !== "open") {
            return;
        }
        if ((event.target as Element).closest(interactive)) {
            return;
        }
        drag.current = { x: event.clientX, moved: false };
    };
    const onPointerMove = (event: PointerEvent<HTMLDivElement>): void => {
        const current = drag.current;
        if (!current) {
            return;
        }
        const dx = event.clientX - current.x;
        if (!current.moved && Math.abs(dx) > 6) {
            current.moved = true;
            event.currentTarget.setPointerCapture?.(event.pointerId);
        }
        if (current.moved) {
            setSwipe(dx);
        }
    };
    const onPointerEnd = (): void => {
        const current = drag.current;
        drag.current = undefined;
        if (!current?.moved) {
            return;
        }
        suppressClick.current = true;
        if (Math.abs(swipe) > SWIPE_DISTANCE) {
            setSwipedOut(Math.sign(swipe));
            onCloseRef.current("Dismissed");
        } else {
            setSwipe(0);
        }
    };

    const { onToastClick } = props;
    const onClick = useCallback(
        (event: MouseEvent<HTMLDivElement>): void => {
            if (suppressClick.current) {
                suppressClick.current = false;
                return;
            }
            const target = event.target as Element;
            if (target.closest(".toast-pro-close")) {
                onCloseRef.current("Content");
                return;
            }
            if (!target.closest(interactive)) {
                onToastClick();
            }
        },
        [onToastClick]
    );
    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
        if (event.key === "Escape") {
            event.stopPropagation();
            onCloseRef.current("Dismissed");
        }
    };

    const bottom = position.startsWith("bottom");
    const behind = !!layout && !layout.expanded && layout.index > 0;
    const height = layout?.height ? (behind ? layout.frontHeight : layout.height) : undefined;
    const state = phase === "exiting" ? "exiting" : entered ? "open" : "entering";
    const style = {
        ...props.style,
        "--tp-y": `${layout ? (bottom ? -layout.offset : layout.offset) : 0}px`,
        "--tp-scale": behind && layout ? 1 - Math.min(layout.index, 3) * 0.05 : 1,
        "--tp-swipe": swipedOut ? `${swipedOut * 120}%` : `${swipe}px`,
        height,
        zIndex: layout ? 100 - layout.index : 100
    } as CSSProperties;

    const toast = (
        <div
            className={classNames(
                "widget-toast-pro-toast",
                "tp-toast",
                `tp--${props.variant}`,
                `tp--${props.animation}`,
                bottom ? "tp--bottom" : "tp--top",
                {
                    "tp--colored": props.colored,
                    "tp--dark": props.dark,
                    "tp--behind": behind,
                    "tp--queued": !!layout?.queued,
                    "tp--clickable": props.clickable,
                    "tp--dragging": swipe !== 0 && !swipedOut,
                    "tp--swiped": swipedOut !== 0
                },
                props.className
            )}
            style={style}
            data-state={state}
            data-closing={phase === "closing" || undefined}
            role={props.variant === "error" ? "alert" : "status"}
            aria-live={props.variant === "error" ? "assertive" : "polite"}
            aria-atomic="true"
            aria-hidden={layout?.queued || undefined}
            tabIndex={layout?.queued ? -1 : 0}
            onClick={onClick}
            onKeyDown={onKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={event => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                    setFocused(false);
                }
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
        >
            <ToastContent
                contentRef={innerRef}
                variant={props.variant}
                busy={busy}
                title={fill(props.title)}
                message={fill(props.message)}
                icon={props.icon}
                customContent={props.customContent}
                replaceText={props.replaceText}
                buttons={props.buttons.map(button => ({ ...button, caption: fill(button.caption) ?? "" }))}
                closeLabel={props.closeLabel}
                onCloseClick={() => onCloseRef.current("Dismissed")}
            />
            {props.showProgress && duration !== undefined && !busy && (
                <div className="tp-toast__progress" aria-hidden="true">
                    <div className="tp-toast__progress-bar" ref={barRef} />
                </div>
            )}
        </div>
    );

    return createPortal(toast, getViewport(position));
}
