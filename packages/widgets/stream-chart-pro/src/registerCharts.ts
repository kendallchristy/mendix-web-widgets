// The ECharts chart types this widget draws. Everything else stays out of its bundle.
import { echarts } from "@kendallchristy/chart-core";
import { ThemeRiverChart } from "echarts/charts";
import { SingleAxisComponent } from "echarts/components";

echarts.use([ThemeRiverChart, SingleAxisComponent]);
