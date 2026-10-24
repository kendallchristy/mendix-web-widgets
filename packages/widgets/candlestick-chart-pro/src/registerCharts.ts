// The ECharts chart types this widget draws. Everything else stays out of its bundle.
import { echarts } from "@kendallchristy/chart-core";
import { BarChart, CandlestickChart, CustomChart, LineChart } from "echarts/charts";

echarts.use([BarChart, CandlestickChart, CustomChart, LineChart]);
