import classNames from "classnames";
import type { EditableValue } from "mendix";
import {
    useCallback,
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState,
    type ReactElement,
    type ReactNode
} from "react";

import type { ToastProContainerProps } from "../typings/ToastProProps";
import { FloatingToast, type Animation } from "./components/FloatingToast";
import type { ButtonStyle, ToastButton } from "./components/ToastContent";
import { useToastLifecycle } from "./components/useToastLifecycle";
import { executeAction, RenderSignal } from "./core/actions";
import { parseVariant, toDuration } from "./core/text";
import type { CloseReason, Position, Variant } from "./core/types";
import "./ui/ToastPro.scss";

const EXIT_DURATION = 220;

function renderIcon(props: ToastProContainerProps): ReactNode | null | undefined {
    if (!props.showIcon) {
        return null;
    }
    const icon = props.customIcon?.value;
    if (!icon) {
        return undefined;
    }
    if (icon.type === "image") {
        return <img className="tp-custom-icon" src={icon.iconUrl} alt="" />;
    }
    return (
        <span
            className={classNames("tp-custom-icon", { glyphicon: icon.type === "glyph" }, icon.iconClass)}
            aria-hidden
        />
    );
}

function writeReason(attribute: EditableValue<string> | undefined, reason: CloseReason): void {
    // An enumeration only takes its own keys; skip reasons the app's enumeration doesn't list.
    if (attribute && !attribute.readOnly && (!attribute.universe || attribute.universe.includes(reason))) {
        attribute.setValue(reason);
    }
}

export function ToastPro(props: ToastProContainerProps): ReactElement {
    const id = useId();
    const [signal] = useState(() => new RenderSignal());
    const latest = useRef(props);
    useLayoutEffect(() => {
        latest.current = props;
        signal.notify();
    });

    const lifecycle = useToastLifecycle({
        actions: () => latest.current,
        signal,
        writeReason: reason => writeReason(latest.current.closeReasonAttribute, reason),
        afterClose: () => {
            const { trigger, showAttribute } = latest.current;
            if (trigger === "ATTRIBUTE" && showAttribute && !showAttribute.readOnly && showAttribute.value) {
                showAttribute.setValue(false);
            }
        },
        exitDuration: EXIT_DURATION
    });
    const { phase, show, close } = lifecycle;

    // Dark mode follows a .dark-mode ancestor of where the widget sits, also when it isn't on <body>.
    const anchorRef = useRef<HTMLSpanElement>(null);
    const [dark, setDark] = useState(false);
    const open = useCallback(() => {
        setDark(!!anchorRef.current?.closest(".dark-mode"));
        show();
    }, [show]);

    const ready =
        props.title?.status !== "loading" &&
        props.message?.status !== "loading" &&
        props.duration?.status !== "loading";
    const closeNow = props.closeWhen?.value === true;

    const loaded = useRef(false);
    useEffect(() => {
        if (props.trigger === "LOAD" && !loaded.current && ready && !closeNow) {
            loaded.current = true;
            open();
        }
    }, [props.trigger, ready, closeNow, open]);

    const triggerValue =
        props.trigger === "EXPRESSION"
            ? props.showWhen?.value
            : props.trigger === "ATTRIBUTE"
              ? props.showAttribute?.value
              : undefined;
    const wasOn = useRef(false);
    useEffect(() => {
        if (!ready) {
            return;
        }
        const on = triggerValue === true;
        if (on && !wasOn.current && !closeNow) {
            open();
        }
        wasOn.current = on;
    }, [triggerValue, ready, closeNow, open]);

    useEffect(() => {
        if (closeNow && (phase === "open" || phase === "opening")) {
            close("Condition");
        }
    }, [closeNow, phase, close]);

    const onToastClick = useCallback(() => {
        executeAction(latest.current.onClick);
        if (latest.current.closeOnToastClick) {
            close("Click");
        }
    }, [close]);

    const buttons: ToastButton[] = props.buttons
        .filter(button => button.visible?.value !== false)
        .map((button, index) => ({
            key: String(index),
            caption: button.caption?.value ?? "",
            style: button.buttonStyle.toLowerCase() as ButtonStyle,
            onClick: () => {
                executeAction(button.action);
                if (button.closeOnClick) {
                    close("Button");
                }
            }
        }));

    const variant = parseVariant(props.variantExpression?.value, props.variant.toLowerCase() as Variant);
    const onScreen = phase === "open" || phase === "closing" || phase === "exiting";

    return (
        <span ref={anchorRef} className="widget-toast-pro" hidden>
            {onScreen && (
                <FloatingToast
                    id={id}
                    phase={phase}
                    generation={lifecycle.generation}
                    variant={variant}
                    busy={props.busy?.value === true}
                    title={props.title?.value}
                    message={props.message?.value}
                    icon={renderIcon(props)}
                    customContent={props.useCustomContent ? props.customContent : undefined}
                    replaceText={props.customContentPlacement === "REPLACE"}
                    buttons={buttons}
                    closeLabel={props.showCloseButton ? (props.closeButtonLabel?.value ?? "Close") : undefined}
                    duration={toDuration(props.duration?.value)}
                    pauseOnHover={props.pauseOnHover}
                    pauseWhenHidden={props.pauseWhenHidden}
                    showProgress={props.showProgress}
                    position={props.position.toLowerCase().replace("_", "-") as Position}
                    alwaysExpanded={props.stackMode === "EXPANDED"}
                    maxVisible={props.maxVisible}
                    width={props.width}
                    groupKey={props.groupKey?.value}
                    colored={props.coloredBackground}
                    animation={props.animation.toLowerCase() as Animation}
                    swipeToDismiss={props.swipeToDismiss}
                    dark={dark}
                    clickable={!!props.onClick || props.closeOnToastClick}
                    className={props.class}
                    style={props.style}
                    onClose={close}
                    onToastClick={onToastClick}
                />
            )}
        </span>
    );
}
