import type { ReactElement } from "react";

interface FooterProps {
    page: number;
    pageCount: number;
    pageSize: number;
    loadedCount: number;
    total: number | undefined;
    onPage(page: number): void;
}

export function Footer(props: FooterProps): ReactElement {
    const first = props.page * props.pageSize + (props.loadedCount > 0 ? 1 : 0);
    const last = props.page * props.pageSize + props.loadedCount;
    return (
        <div className="dgp-footer">
            <span className="dgp-footer-range">
                {first.toLocaleString()}–{last.toLocaleString()}
                {props.total !== undefined && ` of ${props.total.toLocaleString()}`}
            </span>
            <div className="dgp-pager">
                <button
                    type="button"
                    className="dgp-tool-button"
                    disabled={props.page === 0}
                    onClick={() => props.onPage(props.page - 1)}
                >
                    Previous
                </button>
                <span className="dgp-page">
                    Page {props.page + 1} of {props.pageCount}
                </span>
                <button
                    type="button"
                    className="dgp-tool-button"
                    disabled={props.page + 1 >= props.pageCount}
                    onClick={() => props.onPage(props.page + 1)}
                >
                    Next
                </button>
            </div>
        </div>
    );
}
