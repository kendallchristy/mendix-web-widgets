/** What the user has selected inside the viewer, split by the page each piece is on. */
export interface ViewerSelection {
    text: string;
    /** The last line's box, to place the selection menu next to. */
    anchor: DOMRect;
    /** Pieces on pages with a markup layer, by page number. */
    pages: Map<number, { layer: HTMLElement; rects: DOMRect[]; text: string }>;
}

function textNodesIn(range: Range): Text[] {
    const root = range.commonAncestorContainer;
    if (root.nodeType === Node.TEXT_NODE) {
        return [root as Text];
    }
    const nodes: Text[] = [];
    const walker = root.ownerDocument!.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (range.intersectsNode(node)) {
            nodes.push(node as Text);
        }
    }
    return nodes;
}

export function readSelection(container: HTMLElement): ViewerSelection | null {
    const selection = container.ownerDocument.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        return null;
    }
    const range = selection.getRangeAt(0);
    const common = range.commonAncestorContainer;
    const element = common.nodeType === Node.ELEMENT_NODE ? (common as Element) : common.parentElement;
    if (!container.contains(common) || element?.closest("input, textarea, .dvp-markup-popover")) {
        return null;
    }
    const text = selection.toString().trim();
    if (!text) {
        return null;
    }

    const layers = Array.from(container.querySelectorAll<HTMLElement>(".dvp-markup-layer")).map(layer => ({
        layer,
        box: layer.getBoundingClientRect(),
        page: Number(layer.dataset.markupPage)
    }));
    const pages: ViewerSelection["pages"] = new Map();
    let anchor: DOMRect | undefined;
    for (const node of textNodesIn(range)) {
        // Measure only the text itself; the rectangles of whole elements would cover the entire page.
        const piece = node.ownerDocument.createRange();
        piece.selectNodeContents(node);
        if (node === range.startContainer) {
            piece.setStart(node, range.startOffset);
        }
        if (node === range.endContainer) {
            piece.setEnd(node, range.endOffset);
        }
        const rects = Array.from(piece.getClientRects()).filter(rect => rect.width > 0 && rect.height > 0);
        if (rects.length === 0) {
            continue;
        }
        anchor = rects[rects.length - 1];
        const centerX = rects[0].left + rects[0].width / 2;
        const centerY = rects[0].top + rects[0].height / 2;
        const hit = layers.find(
            ({ box }) => centerX >= box.left && centerX <= box.right && centerY >= box.top && centerY <= box.bottom
        );
        if (!hit) {
            continue;
        }
        const entry = pages.get(hit.page) ?? { layer: hit.layer, rects: [], text: "" };
        entry.rects.push(...rects);
        entry.text += piece.toString();
        pages.set(hit.page, entry);
    }
    anchor ??= range.getBoundingClientRect();
    return { text, anchor, pages };
}
