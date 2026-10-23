import { useCallback, useRef, useState, type MouseEvent, type ReactElement } from "react";
import { createPortal } from "react-dom";

interface TooltipState {
    text: string;
    x: number;
    y: number;
}

/**
 * One tooltip for the whole grid, driven by delegated mouse events. It shows the full list behind a "+N" chip
 * and the full text of truncated cells.
 */
export function useTooltip(): {
    state: TooltipState | undefined;
    onMouseOver(event: MouseEvent): void;
    hide(): void;
} {
    const [state, setState] = useState<TooltipState | undefined>();
    const current = useRef<Element | null>(null);

    const onMouseOver = useCallback((event: MouseEvent) => {
        const target = event.target as HTMLElement;
        const tip = target.closest<HTMLElement>("[data-dgp-tip]");
        const truncated = target.closest<HTMLElement>(".dgp-text");
        const element = tip ?? (truncated && truncated.scrollWidth > truncated.clientWidth ? truncated : null);
        if (element === current.current) {
            return;
        }
        current.current = element;
        if (!element) {
            setState(undefined);
            return;
        }
        const rect = element.getBoundingClientRect();
        setState({ text: tip?.dataset.dgpTip ?? element.textContent ?? "", x: rect.left, y: rect.bottom + 4 });
    }, []);

    const hide = useCallback(() => {
        current.current = null;
        setState(undefined);
    }, []);

    return { state, onMouseOver, hide };
}

export function Tooltip({ state }: { state: TooltipState | undefined }): ReactElement | null {
    if (!state) {
        return null;
    }
    return createPortal(
        <div className="dgp-tooltip" role="tooltip" style={{ left: state.x, top: state.y }}>
            {state.text.split("\n").map((line, i) => (
                <div key={i}>{line}</div>
            ))}
        </div>,
        document.body
    );
}
