import classNames from "classnames";
import { useEffect, useRef, useState, type ChangeEvent, type PointerEvent, type ReactElement } from "react";

import type { Labels } from "../core/labels";
import { trimCanvas, type Signature } from "../core/signatures";

type Mode = "draw" | "type" | "upload";

const INK = "#1f2a44";
const PAD_WIDTH = 960;
const PAD_HEIGHT = 300;
// Handwriting fonts that ship with Windows, macOS and most Linux desktops, in that order.
const SCRIPT_FONT = '"Segoe Script", "Snell Roundhand", "Apple Chancery", "Brush Script MT", "URW Chancery L", cursive';

function typedSignature(name: string): Signature | null {
    const canvas = document.createElement("canvas");
    canvas.width = PAD_WIDTH;
    canvas.height = PAD_HEIGHT;
    const context = canvas.getContext("2d");
    if (!context || !name.trim()) {
        return null;
    }
    let size = 120;
    context.font = `${size}px ${SCRIPT_FONT}`;
    while (context.measureText(name).width > PAD_WIDTH - 40 && size > 30) {
        size -= 6;
        context.font = `${size}px ${SCRIPT_FONT}`;
    }
    context.fillStyle = INK;
    context.textBaseline = "middle";
    context.fillText(name, 20, PAD_HEIGHT / 2);
    return trimCanvas(canvas, 8);
}

function imageSignature(file: File): Promise<Signature | null> {
    return new Promise(resolve => {
        const url = URL.createObjectURL(file);
        const image = new Image();
        image.onload = () => {
            const scale = Math.min(1, PAD_WIDTH / image.naturalWidth, PAD_HEIGHT / image.naturalHeight);
            const canvas = document.createElement("canvas");
            canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
            canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
            const context = canvas.getContext("2d");
            if (!context) {
                resolve(null);
                return;
            }
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            // A photo or scan of a signature has a light background; make it see-through.
            const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
            const data = pixels.data;
            for (let i = 0; i < data.length; i += 4) {
                const light = (data[i] + data[i + 1] + data[i + 2]) / 3;
                if (light > 215) {
                    data[i + 3] = 0;
                }
            }
            context.putImageData(pixels, 0, 0);
            URL.revokeObjectURL(url);
            resolve(trimCanvas(canvas, 4));
        };
        image.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(null);
        };
        image.src = url;
    });
}

/** Lets the user draw, type or upload a signature. */
export function SignatureDialog(props: {
    labels: Labels;
    signerName?: string;
    onDone(signature: Signature): void;
    onCancel(): void;
}): ReactElement {
    const { labels } = props;
    const [mode, setMode] = useState<Mode>("draw");
    const [name, setName] = useState(props.signerName ?? "");
    const [drawn, setDrawn] = useState(false);
    const [uploaded, setUploaded] = useState<Signature | null>(null);
    const pad = useRef<HTMLCanvasElement>(null);
    const stroke = useRef<{ x: number; y: number } | null>(null);
    const dialog = useRef<HTMLDivElement>(null);

    useEffect(() => {
        dialog.current?.focus();
    }, []);

    const point = (event: PointerEvent<HTMLCanvasElement>): { x: number; y: number } => {
        const box = event.currentTarget.getBoundingClientRect();
        return {
            x: ((event.clientX - box.left) / (box.width || 1)) * PAD_WIDTH,
            y: ((event.clientY - box.top) / (box.height || 1)) * PAD_HEIGHT
        };
    };
    const onPointerDown = (event: PointerEvent<HTMLCanvasElement>): void => {
        event.currentTarget.setPointerCapture?.(event.pointerId);
        stroke.current = point(event);
        const context = pad.current?.getContext("2d");
        if (context) {
            context.fillStyle = INK;
            context.beginPath();
            context.arc(stroke.current.x, stroke.current.y, 2.5, 0, Math.PI * 2);
            context.fill();
        }
        setDrawn(true);
    };
    const onPointerMove = (event: PointerEvent<HTMLCanvasElement>): void => {
        const from = stroke.current;
        const context = pad.current?.getContext("2d");
        if (!from || !context) {
            return;
        }
        const to = point(event);
        context.strokeStyle = INK;
        context.lineWidth = event.pointerType === "pen" ? 3 + 3 * (event.pressure || 0.5) : 5;
        context.lineCap = "round";
        context.lineJoin = "round";
        context.beginPath();
        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);
        context.stroke();
        stroke.current = to;
    };
    const onPointerUp = (): void => {
        stroke.current = null;
    };
    const clear = (): void => {
        const canvas = pad.current;
        canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
        setDrawn(false);
    };

    const onFile = (event: ChangeEvent<HTMLInputElement>): void => {
        const file = event.target.files?.[0];
        if (file) {
            imageSignature(file).then(setUploaded);
        }
    };

    const ready = mode === "draw" ? drawn : mode === "type" ? Boolean(name.trim()) : Boolean(uploaded);
    const apply = (): void => {
        const signature =
            mode === "draw"
                ? pad.current
                    ? trimCanvas(pad.current)
                    : null
                : mode === "type"
                  ? typedSignature(name)
                  : uploaded;
        if (signature) {
            props.onDone(signature);
        }
    };

    const tabs: Array<{ id: Mode; label: string }> = [
        { id: "draw", label: labels.signDraw },
        { id: "type", label: labels.signType },
        { id: "upload", label: labels.signUpload }
    ];

    return (
        <div
            className="dvp-dialog-backdrop"
            onPointerDown={event => event.target === event.currentTarget && props.onCancel()}
        >
            <div
                ref={dialog}
                className="dvp-dialog dvp-signature-dialog"
                role="dialog"
                aria-modal="true"
                aria-label={labels.signTitle}
                tabIndex={-1}
                onKeyDown={event => {
                    if (event.key === "Escape") {
                        event.preventDefault();
                        event.stopPropagation();
                        props.onCancel();
                    }
                }}
            >
                <div className="dvp-dialog-title">{labels.signTitle}</div>
                <div className="dvp-segmented" role="tablist">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={mode === tab.id}
                            className={classNames("dvp-segment", { "dvp-segment--active": mode === tab.id })}
                            onClick={() => setMode(tab.id)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="dvp-signature-area">
                    {mode === "draw" && (
                        <canvas
                            ref={pad}
                            className="dvp-signature-pad"
                            width={PAD_WIDTH}
                            height={PAD_HEIGHT}
                            aria-label={labels.signDraw}
                            onPointerDown={onPointerDown}
                            onPointerMove={onPointerMove}
                            onPointerUp={onPointerUp}
                            onPointerCancel={onPointerUp}
                        />
                    )}
                    {mode === "type" && (
                        <div className="dvp-signature-typed">
                            <input
                                className="dvp-signature-name"
                                type="text"
                                value={name}
                                placeholder={labels.signTypePlaceholder}
                                aria-label={labels.signTypePlaceholder}
                                onChange={event => setName(event.target.value)}
                                autoFocus
                            />
                            <div className="dvp-signature-preview" style={{ fontFamily: SCRIPT_FONT, color: INK }}>
                                {name}
                            </div>
                        </div>
                    )}
                    {mode === "upload" && (
                        <label className="dvp-signature-upload">
                            {uploaded ? <img src={uploaded.image} alt="" /> : <span>{labels.signUploadPrompt}</span>}
                            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onFile} />
                        </label>
                    )}
                    {mode !== "upload" && <span className="dvp-signature-line" aria-hidden="true" />}
                </div>
                <div className="dvp-dialog-actions">
                    {mode === "draw" && (
                        <button type="button" className="dvp-button" onClick={clear} disabled={!drawn}>
                            {labels.signClear}
                        </button>
                    )}
                    <span className="dvp-markup-spacer" />
                    <button type="button" className="dvp-button" onClick={props.onCancel}>
                        {labels.signCancel}
                    </button>
                    <button type="button" className="dvp-button dvp-button--primary" onClick={apply} disabled={!ready}>
                        {labels.signApply}
                    </button>
                </div>
            </div>
        </div>
    );
}
