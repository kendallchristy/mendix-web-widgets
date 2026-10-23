// Builders for Studio Pro's structure mode preview (the object returned by
// getPreview in the editor config). Adapted from mendix/web-widgets
// (packages/shared/widget-plugin-platform/src/preview/structure-preview-api.ts), Apache-2.0.

interface BaseStyle {
    grow?: number;
}

interface BlockStyle extends BaseStyle {
    borders?: boolean;
    borderRadius?: number;
    borderWidth?: number;
    backgroundColor?: string;
    padding?: number;
}

interface TextStyle extends BaseStyle {
    fontSize?: number;
    fontColor?: string;
    bold?: boolean;
    italic?: boolean;
}

export type StructurePreviewProps =
    | ({ type: "Container"; children?: StructurePreviewProps[] } & BlockStyle)
    | ({ type: "RowLayout"; columnSize?: "fixed" | "grow"; children: StructurePreviewProps[] } & BlockStyle)
    | ({ type: "Text"; content: string } & TextStyle)
    | ({ type: "DropZone"; property: object; placeholder?: string; showDataSourceHeader?: boolean } & BaseStyle)
    | ({ type: "Selectable"; object: object; child: StructurePreviewProps } & BaseStyle)
    | ({ type: "Datasource"; property: object | null; child?: StructurePreviewProps } & BaseStyle);

export const container =
    (style?: BlockStyle) =>
    (...children: StructurePreviewProps[]): StructurePreviewProps => ({ type: "Container", ...style, children });

export const rowLayout =
    (style?: BlockStyle & { columnSize?: "fixed" | "grow" }) =>
    (...children: StructurePreviewProps[]): StructurePreviewProps => ({ type: "RowLayout", ...style, children });

export const text =
    (style?: TextStyle) =>
    (content: string): StructurePreviewProps => ({ type: "Text", ...style, content });

export const dropzone =
    (placeholder: string) =>
    (property: object): StructurePreviewProps => ({ type: "DropZone", property, placeholder });

export const selectable =
    (object: object, style?: BaseStyle) =>
    (child: StructurePreviewProps): StructurePreviewProps => ({ type: "Selectable", object, child, ...style });
