import classNames from "classnames";
import type { ObjectItem } from "mendix";
import { useCallback, useEffect, useMemo, type ReactElement } from "react";

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
    useEffect(() => {
        if (!ready) {
            return;
        }
        datasource.setSortOrder(sortAttribute && sortDirection ? [[sortAttribute, sortDirection]] : undefined);
        resetData();
        // datasource changes identity on every update; only the sort itself matters here.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ready, sortAttribute, sortDirection]);

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
