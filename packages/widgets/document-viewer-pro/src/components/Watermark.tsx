import type { ReactElement } from "react";

const COPIES = 24;

/** Repeats a text diagonally over the document. Plain elements rather than an image, so strict CSPs allow it. */
export function Watermark(props: { text: string }): ReactElement {
    return (
        <div className="dvp-watermark" aria-hidden="true">
            {Array.from({ length: COPIES }, (_, i) => (
                <span key={i}>{props.text}</span>
            ))}
        </div>
    );
}
