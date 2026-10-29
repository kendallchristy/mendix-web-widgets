import classNames from "classnames";
import { useState, type PointerEvent, type ReactElement } from "react";

import type { Labels } from "../core/labels";
import { fromView, rectFromView, rectToView, type Rect } from "../core/markup";
import {
    fitInto,
    moveRect,
    placeAt,
    type PlacedSignature,
    type Signature,
    type SignatureField
} from "../core/signatures";
import { Icon } from "./Icons";

export interface SignatureLayerProps {
    page: number;
    width: number;
    height: number;
    rotation: number;
    signatures: PlacedSignature[];
    fields: SignatureField[];
    /** The signature waiting to be placed, if the user is placing one. */
    placing: Signature | null;
    selectedId: string | null;
    editable: boolean;
    labels: Labels;
    onPlace(page: number, rect: Rect, field?: string): void;
    onSignField(field: SignatureField): void;
    onChange(id: string, rect: Rect): void;
    onSelect(id: string | null): void;
    onRemove(id: string): void;
}

type Drag = { id: string; kind: "move" | "resize"; x: number; y: number; view: Rect; rect: Rect };

/** Signatures on one page: placing a new one, moving and resizing placed ones, and the PDF's empty signature fields. */
export function SignatureLayer(props: SignatureLayerProps): ReactElement {
    const { page, width, height, rotation, placing, labels } = props;
    const [drag, setDrag] = useState<Drag | null>(null);
    const [preview, setPreview] = useState<Rect | null>(null);
    const turned = rotation % 180 !== 0;
    // The page's height divided by its width, before the user's rotation.
    const pageAspect = turned ? width / (height || 1) : height / (width || 1);
    const signatures = props.signatures.filter(signature => signature.page === page);
    const signed = new Set(signatures.map(signature => signature.field).filter(Boolean));
    const fields = props.fields.filter(field => field.page === page && !signed.has(field.key));

    const viewBox = (rect: Rect): Rect => {
        const [x, y, w, h] = rectToView(rect, rotation);
        return [x * width, y * height, w * width, h * height];
    };
    const toPage = (event: PointerEvent<HTMLElement>, box: DOMRect): [number, number] =>
        fromView(
            (event.clientX - box.left) / (box.width || 1),
            (event.clientY - box.top) / (box.height || 1),
            rotation
        );

    const onLayerPointerMove = (event: PointerEvent<HTMLDivElement>): void => {
        if (placing) {
            const [x, y] = toPage(event, event.currentTarget.getBoundingClientRect());
            setPreview(placeAt(x, y, placing, pageAspect));
            return;
        }
        if (!drag) {
            return;
        }
        const dx = (event.clientX - drag.x) / (width || 1);
        const dy = (event.clientY - drag.y) / (height || 1);
        const [vx, vy, vw, vh] = drag.view;
        let view: Rect;
        if (drag.kind === "move") {
            view = moveRect(drag.view, dx, dy);
        } else {
            // Resizing keeps the signature's shape.
            const grown = Math.max(0.03, vw + dx);
            view = [vx, vy, grown, (vh * grown) / vw];
        }
        props.onChange(drag.id, rectFromView(view, rotation));
    };
    const onLayerPointerUp = (event: PointerEvent<HTMLDivElement>): void => {
        if (placing && event.button === 0) {
            const [x, y] = toPage(event, event.currentTarget.getBoundingClientRect());
            props.onPlace(page, placeAt(x, y, placing, pageAspect));
            setPreview(null);
        }
        setDrag(null);
    };

    const startDrag = (event: PointerEvent<HTMLElement>, signature: PlacedSignature, kind: Drag["kind"]): void => {
        if (!props.editable || placing || event.button !== 0) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        (event.currentTarget.closest(".dvp-signature-layer") as HTMLElement | null)?.setPointerCapture?.(
            event.pointerId
        );
        props.onSelect(signature.id);
        setDrag({
            id: signature.id,
            kind,
            x: event.clientX,
            y: event.clientY,
            view: rectToView(signature.rect, rotation),
            rect: signature.rect
        });
    };

    const image = (signature: Signature, box: Rect): ReactElement => {
        // The image keeps the page's orientation, so it turns with the page.
        const [, , w, h] = box;
        return (
            <img
                src={signature.image}
                alt=""
                draggable={false}
                style={{
                    width: turned ? h : w,
                    height: turned ? w : h,
                    transform: `translate(-50%, -50%) rotate(${rotation}deg)`
                }}
            />
        );
    };

    return (
        <div
            className={classNames("dvp-signature-layer", {
                "dvp-signature-layer--placing": Boolean(placing),
                "dvp-signature-layer--dragging": Boolean(drag)
            })}
            onPointerMove={onLayerPointerMove}
            onPointerUp={onLayerPointerUp}
            onPointerLeave={() => setPreview(null)}
            // The click that places a signature shouldn't also reach the page and select something else.
            onClick={event => event.stopPropagation()}
            data-page={page}
        >
            {fields.map(field => {
                const [x, y, w, h] = viewBox(field.rect);
                return (
                    <button
                        key={field.key}
                        type="button"
                        className="dvp-signature-field"
                        style={{ left: x, top: y, width: w, height: h }}
                        disabled={!props.editable}
                        onPointerUp={event => event.stopPropagation()}
                        onClick={event => {
                            event.stopPropagation();
                            if (placing) {
                                props.onPlace(page, fitInto(field.rect, placing, pageAspect), field.key);
                            } else {
                                props.onSignField(field);
                            }
                        }}
                    >
                        <Icon name="signature" />
                        <span>{labels.signHere}</span>
                    </button>
                );
            })}
            {signatures.map(signature => {
                const box = viewBox(signature.rect);
                const selected = signature.id === props.selectedId;
                return (
                    <div
                        key={signature.id}
                        className={classNames("dvp-signature", { "dvp-signature--selected": selected })}
                        style={{ left: box[0], top: box[1], width: box[2], height: box[3] }}
                        onPointerDown={event => startDrag(event, signature, "move")}
                        onClick={event => event.stopPropagation()}
                    >
                        {image(signature, box)}
                        {selected && props.editable && (
                            <>
                                <button
                                    type="button"
                                    className="dvp-signature-remove"
                                    aria-label={labels.removeSignature}
                                    title={labels.removeSignature}
                                    onPointerDown={event => event.stopPropagation()}
                                    onClick={() => props.onRemove(signature.id)}
                                >
                                    <Icon name="close" />
                                </button>
                                <span
                                    className="dvp-signature-handle"
                                    onPointerDown={event => startDrag(event, signature, "resize")}
                                />
                            </>
                        )}
                    </div>
                );
            })}
            {placing && preview && (
                <div
                    className="dvp-signature dvp-signature--preview"
                    style={(() => {
                        const box = viewBox(preview);
                        return { left: box[0], top: box[1], width: box[2], height: box[3] };
                    })()}
                >
                    {image(placing, viewBox(preview))}
                </div>
            )}
        </div>
    );
}
