import classNames from "classnames";
import type { ReactElement } from "react";

import type { Labels } from "../core/labels";
import { MARKUP_COLORS, type MarkupTool } from "../core/markup";
import { Icon, type IconName } from "./Icons";

const TOOLS: Array<{ tool: MarkupTool; icon: IconName; label: keyof Labels }> = [
    { tool: "select", icon: "pointer", label: "markupSelect" },
    { tool: "highlight", icon: "highlighter", label: "markupHighlight" },
    { tool: "area", icon: "area", label: "markupArea" },
    { tool: "note", icon: "note", label: "markupNote" },
    { tool: "ink", icon: "pen", label: "markupDraw" }
];

export function MarkupBar(props: {
    labels: Labels;
    tool: MarkupTool;
    color: string;
    /** Text highlights need a text layer, which only PDFs have. */
    textHighlights: boolean;
    canUndo: boolean;
    canRedo: boolean;
    canDelete: boolean;
    onTool(tool: MarkupTool): void;
    onColor(color: string): void;
    onUndo(): void;
    onRedo(): void;
    onDelete(): void;
    onClose(): void;
}): ReactElement {
    const { labels } = props;
    return (
        <div className="dvp-markup-bar" role="toolbar" aria-label={labels.markup}>
            <div className="dvp-markup-tools" role="radiogroup" aria-label={labels.markup}>
                {TOOLS.filter(entry => entry.tool !== "highlight" || props.textHighlights).map(entry => (
                    <button
                        key={entry.tool}
                        type="button"
                        role="radio"
                        aria-checked={props.tool === entry.tool}
                        className={classNames("dvp-tool", { "dvp-tool--active": props.tool === entry.tool })}
                        aria-label={labels[entry.label]}
                        title={labels[entry.label]}
                        onClick={() => props.onTool(entry.tool)}
                    >
                        <Icon name={entry.icon} />
                    </button>
                ))}
            </div>
            <span className="dvp-markup-divider" />
            <div className="dvp-markup-swatches" role="radiogroup" aria-label={labels.markupColor}>
                {MARKUP_COLORS.map((color, i) => (
                    <button
                        key={color}
                        type="button"
                        role="radio"
                        aria-checked={props.color === color}
                        aria-label={`${labels.markupColor} ${i + 1}`}
                        className="dvp-markup-swatch"
                        style={{ background: color }}
                        onClick={() => props.onColor(color)}
                    />
                ))}
            </div>
            <span className="dvp-markup-divider" />
            <button
                type="button"
                className="dvp-tool"
                aria-label={labels.markupUndo}
                title={labels.markupUndo}
                disabled={!props.canUndo}
                onClick={props.onUndo}
            >
                <Icon name="undo" />
            </button>
            <button
                type="button"
                className="dvp-tool"
                aria-label={labels.markupRedo}
                title={labels.markupRedo}
                disabled={!props.canRedo}
                onClick={props.onRedo}
            >
                <Icon name="redo" />
            </button>
            <button
                type="button"
                className="dvp-tool"
                aria-label={labels.markupDelete}
                title={labels.markupDelete}
                disabled={!props.canDelete}
                onClick={props.onDelete}
            >
                <Icon name="trash" />
            </button>
            <span className="dvp-markup-spacer" />
            <button
                type="button"
                className="dvp-tool"
                aria-label={labels.markupClose}
                title={labels.markupClose}
                onClick={props.onClose}
            >
                <Icon name="close" />
            </button>
        </div>
    );
}
