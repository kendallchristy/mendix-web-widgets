import classNames from "classnames";
import { useEffect, useRef, useState, type ReactElement } from "react";

import type { Labels } from "../core/labels";
import type { OutlineItem, Thumbnails } from "../views/types";

const THUMB_WIDTH = 120;

function Thumbnail(props: {
    index: number;
    thumbnails: Thumbnails;
    active: boolean;
    label: string;
    onSelect(page: number): void;
}): ReactElement {
    const { index, thumbnails, active } = props;
    const button = useRef<HTMLButtonElement>(null);
    const canvas = useRef<HTMLCanvasElement>(null);
    const [visible, setVisible] = useState(false);

    // Draw a thumbnail only once it scrolls into view.
    useEffect(() => {
        const element = button.current;
        if (!element || typeof IntersectionObserver === "undefined") {
            setVisible(true);
            return;
        }
        const observer = new IntersectionObserver(entries => {
            if (entries.some(entry => entry.isIntersecting)) {
                setVisible(true);
                observer.disconnect();
            }
        });
        observer.observe(element);
        return () => {
            observer.disconnect();
        };
    }, []);

    useEffect(() => {
        if (visible && canvas.current) {
            thumbnails.render(index, canvas.current, THUMB_WIDTH).catch(() => undefined);
        }
    }, [visible, thumbnails, index]);

    useEffect(() => {
        if (active) {
            button.current?.scrollIntoView?.({ block: "nearest" });
        }
    }, [active]);

    return (
        <button
            ref={button}
            type="button"
            className={classNames("dvp-thumb", { "dvp-thumb--active": active })}
            onClick={() => props.onSelect(index + 1)}
            aria-label={props.label}
            aria-current={active ? "page" : undefined}
        >
            <span
                className="dvp-thumb-frame"
                style={{ width: THUMB_WIDTH, height: Math.round(THUMB_WIDTH * thumbnails.aspect(index)) }}
            >
                <canvas ref={canvas} />
            </span>
            <span className="dvp-thumb-number">{index + 1}</span>
        </button>
    );
}

function outlineKeys(items: OutlineItem[]): string[] {
    const seen = new Map<string, number>();
    return items.map(item => {
        const base = `${item.title}|${item.page ?? item.url ?? ""}`;
        const count = seen.get(base) ?? 0;
        seen.set(base, count + 1);
        return `${base}|${count}`;
    });
}

function OutlineTree(props: { items: OutlineItem[]; onSelect(page: number): void; depth?: number }): ReactElement {
    const keys = outlineKeys(props.items);
    return (
        <ul className="dvp-outline" role={props.depth ? "group" : "tree"}>
            {props.items.map((item, i) => (
                <li key={keys[i]} role="treeitem" aria-selected={false}>
                    <button
                        type="button"
                        className="dvp-outline-item"
                        style={{ paddingLeft: 8 + (props.depth ?? 0) * 14 }}
                        onClick={() => {
                            if (item.page) {
                                props.onSelect(item.page);
                            } else if (item.url) {
                                window.open(item.url, "_blank", "noopener,noreferrer");
                            }
                        }}
                    >
                        {item.title}
                    </button>
                    {item.children.length > 0 && (
                        <OutlineTree items={item.children} onSelect={props.onSelect} depth={(props.depth ?? 0) + 1} />
                    )}
                </li>
            ))}
        </ul>
    );
}

export function Sidebar(props: {
    labels: Labels;
    thumbnails?: Thumbnails;
    outline?: OutlineItem[];
    page: number;
    onSelect(page: number): void;
}): ReactElement {
    const { labels, thumbnails, outline } = props;
    const hasOutline = Boolean(outline?.length);
    const [tab, setTab] = useState<"pages" | "outline">(thumbnails ? "pages" : "outline");
    const shown = tab === "outline" && hasOutline ? "outline" : thumbnails ? "pages" : "outline";
    return (
        <aside className="dvp-sidebar">
            {thumbnails && hasOutline && (
                <div className="dvp-sidebar-tabs" role="tablist">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={shown === "pages"}
                        className={classNames("dvp-sidebar-tab", { "dvp-sidebar-tab--active": shown === "pages" })}
                        onClick={() => setTab("pages")}
                    >
                        {labels.thumbnails}
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={shown === "outline"}
                        className={classNames("dvp-sidebar-tab", { "dvp-sidebar-tab--active": shown === "outline" })}
                        onClick={() => setTab("outline")}
                    >
                        {labels.outline}
                    </button>
                </div>
            )}
            <div className="dvp-sidebar-body">
                {shown === "pages" && thumbnails
                    ? Array.from({ length: thumbnails.count }, (_, i) => (
                          <Thumbnail
                              key={i}
                              index={i}
                              thumbnails={thumbnails}
                              active={props.page === i + 1}
                              label={`${labels.pageNumber} ${i + 1}`}
                              onSelect={props.onSelect}
                          />
                      ))
                    : outline && <OutlineTree items={outline} onSelect={props.onSelect} />}
            </div>
        </aside>
    );
}
