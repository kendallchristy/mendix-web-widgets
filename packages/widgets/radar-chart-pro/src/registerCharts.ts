// The ECharts chart types this widget draws. Everything else stays out of its bundle.
import { echarts } from "@kendallchristy/chart-core";
import { RadarChart } from "echarts/charts";
import { RadarComponent } from "echarts/components";

echarts.use([RadarChart, RadarComponent]);
