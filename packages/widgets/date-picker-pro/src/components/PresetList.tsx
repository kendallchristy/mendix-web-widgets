// The preset sidebar ("Today", "Last week", ... and "Custom" at the bottom). Chips across the top on phones.
import classNames from "classnames";
import type { ReactElement } from "react";

import type { Preset } from "../core/presets";

export interface PresetListProps {
    presets: Preset[];
    activeId?: string;
    /** Whether a value is picked that matches no preset, which lights up "Custom". */
    custom: boolean;
    customLabel: string;
    label: string;
    compact: boolean;
    onPick: (preset: Preset) => void;
}

export function PresetList({
    presets,
    activeId,
    custom,
    customLabel,
    label,
    compact,
    onPick
}: PresetListProps): ReactElement {
    return (
        <div
            className={classNames("dpp-presets", {
                "dpp-presets--chips": compact
            })}
            role="group"
            aria-label={label}
        >
            <ul className="dpp-presets__list">
                {presets.map(preset => (
                    <li key={preset.id}>
                        <button
                            type="button"
                            className={classNames("dpp-preset", {
                                "dpp-preset--active": preset.id === activeId
                            })}
                            aria-pressed={preset.id === activeId}
                            onClick={() => onPick(preset)}
                        >
                            {preset.label}
                        </button>
                    </li>
                ))}
            </ul>
            {customLabel && !compact ? (
                <div
                    className={classNames("dpp-preset dpp-preset--custom", {
                        "dpp-preset--active": custom
                    })}
                    aria-current={custom || undefined}
                >
                    {customLabel}
                </div>
            ) : null}
        </div>
    );
}
