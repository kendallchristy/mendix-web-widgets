import classNames from "classnames";
import type { ObjectItem } from "mendix";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, type ReactElement } from "react";

import type { DataGridProContainerProps } from "../typings/DataGridProProps";
import { Footer } from "./components/Footer";
import { Grid } from "./components/Grid";
import { Toolbar } from "./components/Toolbar";
import { buildColumns } from "./model/columns";
import { ROW_HEIGHT, type Density, type GridSettings } from "./model/types";
import { useGridData } from "./model/useGridData";
import { useGridSettings } from "./model/useGridSettings";
import { useRelatedObjects } from "./model/useRelatedObjects";
import { useSelection } from "./model/useSelection";
import "./ui/DataGridPro.scss";

export function DataGridPro(props: DataGridProContainerProps): ReactElement {
    const { datasource } = props;
    const data = useGridData(datasource, props.pagination, props.pageSize);
    const related = useRelatedObjects(props.columns, data.items);
    const allColumns = useMemo(() => buildColumns(props.columns, related), [props.columns, related]);
    const selection = useSelection(props.itemSelection);
    // Effects below clear the selection without re-running whenever the selection changes.
    const clearSelection = useRef(selection.clear);
    useLayoutEffect(() => {
        clearSelection.current = selection.clear;
    });

    // By default Mendix drops selected rows that aren't in the latest response, and with virtual scrolling every
    // window move is a new response. Keep them, so a bulk action gets every row the user picked.
    const setKeepSelection = props.itemSelection?.setKeepSelection;
    useEffect(() => {
        setKeepSelection?.(() => true);
    }, [setKeepSelection]);

    const initialSettings = useMemo(
        (): GridSettings => ({
            hidden: allColumns.filter(c => c.hiddenByDefault).map(c => c.id),
            widths: {}
        }),
        // Defaults only matter before the user changes anything.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );
    const { settings, ready, update } = useGridSettings(
        props.configurationStorage,
        props.configurationAttribute,
        `dgp:${window.location.pathname}:${props.name}`,
        props.columns.length,
        initialSettings
    );
    const columns = useMemo(
        () => allColumns.filter(column => !settings.hidden.includes(column.id)),
        [allColumns, settings.hidden]
    );

    // Apply the sort order. Runs once saved settings are known, and again whenever the user sorts.
    const sortAttribute = allColumns.find(c => c.id === settings.sort?.columnId)?.sortAttribute;
    const sortDirection = settings.sort?.direction;
    const resetData = data.reset;
    const appliedSort = useRef<string | undefined>(undefined);
    const keepSelection = props.keepSelection;
    useEffect(() => {
        if (!ready) {
            return;
        }
        const sortKey = `${sortAttribute}:${sortDirection}`;
        if (!keepSelection && appliedSort.current !== undefined && appliedSort.current !== sortKey) {
            clearSelection.current();
        }
        appliedSort.current = sortKey;
        datasource.setSortOrder(sortAttribute && sortDirection ? [[sortAttribute, sortDirection]] : undefined);
        resetData();
        // datasource changes identity on every update; only the sort itself matters here.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready, sortAttribute, sortDirection]);

    // After a bulk action, clear the selection once its changes come back, so the bar doesn't linger over rows
    // that were just processed. Actions that change nothing, like an export, leave the selection as it is.
    const bulkActionRan = useRef(false);
    const onBulkAction = props.clearAfterBulkAction
        ? () => {
              bulkActionRan.current = true;
          }
        : undefined;
    useEffect(() => {
        if (bulkActionRan.current) {
            bulkActionRan.current = false;
            clearSelection.current();
        }
    }, [data.refreshes]);

    const refreshSeconds = props.refreshInterval;
    useEffect(() => {
        if (refreshSeconds <= 0) {
            return;
        }
        const timer = setInterval(() => datasource.reload(), refreshSeconds * 1000);
        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshSeconds]);

    const onSort = useCallback(
        (columnId: string) => {
            const current = settings.sort?.columnId === columnId ? settings.sort.direction : undefined;
            const next = current === undefined ? "asc" : current === "asc" ? "desc" : undefined;
            update({ sort: next ? { columnId, direction: next } : undefined });
        },
        [settings.sort, update]
    );

    const onResize = useCallback(
        (columnId: string, width: number) => update({ widths: { ...settings.widths, [columnId]: width } }),
        [settings.widths, update]
    );

    const onToggleColumn = (columnId: string): void => {
        const hidden = settings.hidden.includes(columnId)
            ? settings.hidden.filter(id => id !== columnId)
            : [...settings.hidden, columnId];
        // Keep at least one column on screen.
        if (hidden.length < allColumns.length) {
            update({ hidden });
        }
    };

    const density: Density = settings.density ?? props.density;
    const { onClick, detailContent, rowClass } = props;
    const onRowAction = useMemo(
        () =>
            onClick
                ? (item: ObjectItem) => {
                      const action = onClick.get(item);
                      if (action.canExecute && !action.isExecuting) {
                          action.execute();
                      }
                  }
                : undefined,
        [onClick]
    );
    const renderDetail = useMemo(
        () => (detailContent ? (item: ObjectItem) => detailContent.get(item) : undefined),
        [detailContent]
    );
    const getRowClass = useCallback((item: ObjectItem) => rowClass?.get(item).value, [rowClass]);

    const hidableColumns = allColumns.some(c => c.hidable) ? allColumns : undefined;

    return (
        <div
            className={classNames("dgp", `dgp--${density}`, `dgp--height-${props.heightMode}`, props.class)}
            style={{ ...props.style, ...(props.heightMode === "fixed" ? { height: props.height } : undefined) }}
        >
            <Toolbar
                title={props.title?.value}
                total={props.showCount ? data.total : undefined}
                content={props.toolbarContent}
                selectedCount={selection.count}
                bulkActions={props.bulkActions}
                onClearSelection={selection.clear}
                onBulkAction={onBulkAction}
                columns={props.showColumnMenu ? hidableColumns : undefined}
                hidden={settings.hidden}
                onToggleColumn={onToggleColumn}
                density={props.showDensityToggle ? density : undefined}
                onDensity={value => update({ density: value })}
            />
            <Grid
                columns={columns}
                data={data}
                rowHeight={ROW_HEIGHT[density]}
                widths={settings.widths}
                onResize={onResize}
                sort={settings.sort}
                onSort={onSort}
                selection={selection}
                renderDetail={renderDetail}
                expandOnRowClick={props.expandTrigger === "row"}
                singleExpand={props.singleExpand}
                rowClass={getRowClass}
                onRowAction={onRowAction}
                clickTrigger={props.onClickTrigger}
                stripes={props.stripes}
                pinFirstColumn={props.pinFirstColumn}
                empty={props.emptyPlaceholder ?? <span className="dgp-empty-text">No results</span>}
                scrollResetKey={`${sortAttribute}:${sortDirection}`}
                ariaLabel={props.title?.value}
            />
            {props.pagination === "pages" && (
                <Footer
                    page={data.page}
                    pageCount={data.pageCount}
                    pageSize={props.pageSize}
                    loadedCount={data.items.length}
                    total={data.total}
                    onPage={data.setPage}
                />
            )}
        </div>
    );
}
