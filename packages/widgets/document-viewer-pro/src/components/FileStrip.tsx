import classNames from "classnames";
import type { ReactElement } from "react";

import { extensionOf } from "../core/fileTypes";
import { Icon } from "./Icons";

export function FileStrip(props: {
    files: Array<{ key: string; name: string; caption?: string }>;
    index: number;
    onSelect(index: number): void;
}): ReactElement {
    return (
        <div className="dvp-file-strip" role="tablist">
            {props.files.map((file, i) => {
                const ext = extensionOf(file.name);
                return (
                    <button
                        key={file.key}
                        type="button"
                        role="tab"
                        aria-selected={i === props.index}
                        className={classNames("dvp-file-chip", { "dvp-file-chip--active": i === props.index })}
                        onClick={() => props.onSelect(i)}
                        title={file.name}
                    >
                        <Icon name="file" />
                        <span className="dvp-file-chip-name">{file.caption || file.name}</span>
                        {ext && <span className="dvp-file-chip-ext">{ext}</span>}
                    </button>
                );
            })}
        </div>
    );
}
