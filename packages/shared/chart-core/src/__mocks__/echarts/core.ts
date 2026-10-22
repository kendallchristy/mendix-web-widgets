// Jest can't load ECharts' ES modules, and unit tests don't draw charts, so ECharts is replaced by a stand-in
// that records what it was given.
export interface FakeChart {
    options: unknown[];
    theme: unknown;
    handlers: Record<string, (params: unknown) => void>;
    setOption: (option: unknown) => void;
    setTheme: (theme: unknown) => void;
    on: (event: string, handler: (params: unknown) => void) => void;
    off: (event: string) => void;
    resize: () => void;
    dispose: () => void;
}

export const charts: FakeChart[] = [];

export function init(_element: unknown, theme: unknown): FakeChart {
    const chart: FakeChart = {
        options: [],
        theme,
        handlers: {},
        setOption: option => chart.options.push(option),
        setTheme: next => {
            chart.theme = next;
        },
        on: (event, handler) => {
            chart.handlers[event] = handler;
        },
        off: event => {
            delete chart.handlers[event];
        },
        resize: () => undefined,
        dispose: () => undefined
    };
    charts.push(chart);
    return chart;
}

export function use(): void {
    // Nothing to register in tests.
}
