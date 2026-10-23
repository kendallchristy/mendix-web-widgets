// The ECharts chart types this widget draws. Everything else stays out of its bundle.
import { echarts } from "@kendallchristy/chart-core";
import { BarChart, LineChart, PictorialBarChart, ScatterChart } from "echarts/charts";

echarts.use([BarChart, LineChart, PictorialBarChart, ScatterChart]);
