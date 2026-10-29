export const MARK_CLASS = "dvp-match";
export const ACTIVE_MARK_CLASS = "dvp-match--active";

function escapeRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function matcher(query: string): RegExp | undefined {
    const trimmed = query.trim();
    return trimmed ? new RegExp(escapeRegExp(trimmed), "gi") : undefined;
}

/** Matches within one string. Views count per text run, so counts agree with what highlightMatches marks. */
export function countMatches(text: string, query: string): number {
    const pattern = matcher(query);
    return pattern ? (text.match(pattern)?.length ?? 0) : 0;
}

export function clearHighlights(root: ParentNode): void {
    root.querySelectorAll(`mark.${MARK_CLASS}`).forEach(mark => {
        const parent = mark.parentNode;
        if (!parent) {
            return;
        }
        parent.replaceChild(document.createTextNode(mark.textContent ?? ""), mark);
        parent.normalize();
    });
}

/** Wraps every match of the query in the root's text in a <mark>, in document order. */
export function highlightMatches(root: Node, query: string): HTMLElement[] {
    const pattern = matcher(query);
    if (!pattern) {
        return [];
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
            const parent = node.parentElement;
            if (!parent || parent.closest("script, style, noscript") || !node.nodeValue?.trim()) {
                return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
        }
    });
    const textNodes: Text[] = [];
    while (walker.nextNode()) {
        textNodes.push(walker.currentNode as Text);
    }
    const marks: HTMLElement[] = [];
    for (const node of textNodes) {
        const text = node.nodeValue ?? "";
        pattern.lastIndex = 0;
        let match = pattern.exec(text);
        if (!match) {
            continue;
        }
        const fragment = document.createDocumentFragment();
        let last = 0;
        while (match) {
            if (match.index > last) {
                fragment.appendChild(document.createTextNode(text.slice(last, match.index)));
            }
            const mark = document.createElement("mark");
            mark.className = MARK_CLASS;
            mark.textContent = match[0];
            fragment.appendChild(mark);
            marks.push(mark);
            last = match.index + match[0].length;
            match = pattern.exec(text);
        }
        if (last < text.length) {
            fragment.appendChild(document.createTextNode(text.slice(last)));
        }
        node.parentNode?.replaceChild(fragment, node);
    }
    return marks;
}

export function setActiveMark(marks: HTMLElement[], index: number, scroll = true): void {
    marks.forEach((mark, i) => mark.classList.toggle(ACTIVE_MARK_CLASS, i === index));
    const active = marks[index];
    if (active && scroll) {
        active.scrollIntoView?.({ block: "center", inline: "nearest" });
    }
}
