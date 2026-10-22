// Jest configuration for packages that draw charts: the widget tools' configuration, with ECharts replaced by
// the stand-ins in src/__mocks__/echarts. Jest can't load ECharts' ES modules, and unit tests don't draw.
const { join } = require("path");

const base = require("@mendix/pluggable-widgets-tools/test-config/jest.config.js");

module.exports = {
    ...base,
    moduleNameMapper: {
        ...base.moduleNameMapper,
        "^echarts/(.*)$": join(__dirname, "src/__mocks__/echarts/$1")
    }
};
