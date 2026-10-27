export type Variant = "success" | "info" | "warning" | "error" | "neutral";

export type Position = "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";

/** Why a toast closed. These are also the values written to the close reason attribute. */
export type CloseReason = "Timeout" | "Dismissed" | "Button" | "Click" | "Content" | "Condition" | "Replaced";

/**
 * hidden: nothing on screen. opening: waiting for On before show. open: on screen and counting down.
 * closing: waiting for On before close, still on screen. exiting: playing the exit animation.
 */
export type Phase = "hidden" | "opening" | "open" | "closing" | "exiting";
