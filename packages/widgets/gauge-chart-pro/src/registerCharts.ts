// The ECharts chart types this widget draws. Everything else stays out of its bundle.
import { echarts } from "@kendallchristy/chart-core";
import { GaugeChart } from "echarts/charts";

echarts.use([GaugeChart]);
