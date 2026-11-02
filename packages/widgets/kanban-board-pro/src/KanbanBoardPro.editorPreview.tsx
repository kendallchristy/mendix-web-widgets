import classNames from "classnames";
import type { CSSProperties, ReactElement } from "react";

import type { KanbanBoardProPreviewProps } from "../typings/KanbanBoardProProps";

/** Design mode preview in Studio Pro: three columns, the first with the drop zones for the widget slots. */
export function preview(props: KanbanBoardProPreviewProps): ReactElement {
    const Card = props.cardContent.renderer;
    const Header = props.columnHeader.renderer;
    const Footer = props.columnFooter.renderer;
    const fromSource = props.columnSource === "datasource";
    const style = { ...props.styleObject, "--kbp-column-width": `${props.columnWidth ?? 280}px` } as CSSProperties;
    const titles = fromSource
        ? [props.columnTitle || "Column", "Column 2", "Column 3"]
        : ["Value 1", "Value 2", "Value 3"];
    return (
        <div className={classNames("kbp kdnd-root", props.class)} style={style}>
            <div className="kbp-board-scroll">
                <div className="kbp-columns">
                    {titles.map((title, i) => (
                        <div key={title} className="kbp-column-slot" style={i > 0 ? { opacity: 0.45 } : undefined}>
                            <div className="kbp-column kdnd-item">
                                <div className="kdnd-item-content">
                                    <div className="kbp-column-head">
                                        <h3 className="kbp-column-title">{title}</h3>
                                        {props.showCount && <span className="kbp-count">3</span>}
                                        {i === 0 && fromSource && (
                                            <Header caption="Header content">
                                                <div className="kbp-column-tools" />
                                            </Header>
                                        )}
                                    </div>
                                    <div className="kbp-column-scroll">
                                        <div className="kbp-cards">
                                            <div className="kbp-card kdnd-item">
                                                <div className="kdnd-item-content">
                                                    {i === 0 ? (
                                                        <Card caption="Card content">
                                                            <div />
                                                        </Card>
                                                    ) : (
                                                        <div style={{ height: 40 }} />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="kbp-card kdnd-item" style={{ opacity: 0.5 }}>
                                                <div className="kdnd-item-content">
                                                    <div style={{ height: 40 }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {i === 0 && fromSource && (
                                        <div className="kbp-column-foot">
                                            <Footer caption="Footer content">
                                                <div />
                                            </Footer>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function getPreviewCss(): string {
    // Studio Pro expects the compiled stylesheet as a string, which the widget build provides for require()
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("./ui/KanbanBoardPro.scss");
}
