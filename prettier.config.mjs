/** @type {import("prettier").Config} */
export default {
    printWidth: 120,
    tabWidth: 4,
    trailingComma: "none",
    arrowParens: "avoid",
    plugins: ["@prettier/plugin-xml"],
    overrides: [
        {
            files: "*.xml",
            options: { printWidth: 500, xmlSelfClosingSpace: true, xmlWhitespaceSensitivity: "preserve" }
        },
        { files: "*.md", options: { proseWrap: "preserve" } },
        { files: ["*.yml", "*.yaml"], options: { tabWidth: 4 } }
    ]
};
