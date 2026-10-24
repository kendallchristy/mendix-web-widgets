// The ECharts chart types this widget draws. Everything else stays out of its bundle.
import { echarts } from "@kendallchristy/chart-core";
import { HeatmapChart } from "echarts/charts";
import { CalendarComponent } from "echarts/components";

echarts.use([HeatmapChart, CalendarComponent]);
