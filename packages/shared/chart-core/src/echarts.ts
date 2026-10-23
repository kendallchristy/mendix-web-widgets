// The parts of ECharts every chart widget uses. Each widget registers its own chart types on top of these, so a
// widget only bundles the chart code it draws.
import {
    AriaComponent,
    DataZoomComponent,
    GridComponent,
    LegendComponent,
    MarkAreaComponent,
    MarkLineComponent,
    MarkPointComponent,
    TitleComponent,
    TooltipComponent,
    VisualMapComponent
} from "echarts/components";
import * as echarts from "echarts/core";
import { LabelLayout } from "echarts/features";
import { CanvasRenderer, SVGRenderer } from "echarts/renderers";

echarts.use([
    AriaComponent,
    DataZoomComponent,
    GridComponent,
    LegendComponent,
    MarkAreaComponent,
    MarkLineComponent,
    MarkPointComponent,
    TitleComponent,
    TooltipComponent,
    VisualMapComponent,
    LabelLayout,
    CanvasRenderer,
    SVGRenderer
]);

export { echarts };
export type { EChartsCoreOption, EChartsType } from "echarts/core";
