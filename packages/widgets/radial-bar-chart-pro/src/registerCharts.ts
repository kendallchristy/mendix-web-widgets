// The ECharts chart types this widget draws. Everything else stays out of its bundle.
import { echarts } from "@kendallchristy/chart-core";
import { BarChart } from "echarts/charts";
import { PolarComponent } from "echarts/components";

echarts.use([BarChart, PolarComponent]);
