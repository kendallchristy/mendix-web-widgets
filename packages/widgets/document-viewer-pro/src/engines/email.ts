import MsgReader from "@kenjiuno/msgreader";
import DOMPurify from "dompurify";
import PostalMime from "postal-mime";

import { registerEngine } from "./register";

export interface EmailAddress {
    name?: string;
    address?: string;
}

export interface EmailAttachment {
    fileName: string;
    mimeType?: string;
    contentId?: string;
    inline: boolean;
    content: Uint8Array;
}

export interface ParsedEmail {
    subject?: string;
    from?: EmailAddress;
    to: EmailAddress[];
    cc: EmailAddress[];
    date?: string;
    html?: string;
    text?: string;
    attachments: EmailAttachment[];
}

function toBytes(content: ArrayBuffer | Uint8Array | string): Uint8Array {
    if (typeof content === "string") {
        return new TextEncoder().encode(content);
    }
    return content instanceof Uint8Array ? content : new Uint8Array(content);
}

function stripBrackets(id: string | undefined): string | undefined {
    return id?.replace(/^<|>$/g, "");
}

async function parseEml(buffer: ArrayBuffer): Promise<ParsedEmail> {
    const mail = await PostalMime.parse(buffer);
    return {
        subject: mail.subject,
        from: mail.from ? { name: mail.from.name, address: mail.from.address } : undefined,
        to: (mail.to ?? []).map(a => ({ name: a.name, address: a.address })),
        cc: (mail.cc ?? []).map(a => ({ name: a.name, address: a.address })),
        date: mail.date,
        html: mail.html,
        text: mail.text,
        attachments: mail.attachments.map(a => ({
            fileName: a.filename ?? "attachment",
            mimeType: a.mimeType,
            contentId: stripBrackets(a.contentId),
            inline: a.disposition === "inline" || Boolean(a.related),
            content: toBytes(a.content)
        }))
    };
}

function parseMsg(buffer: ArrayBuffer): ParsedEmail {
    const reader = new MsgReader(buffer);
    const data = reader.getFileData();
    const recipients = data.recipients ?? [];
    const pick = (kind: "to" | "cc"): EmailAddress[] =>
        recipients
            .filter(r => (r.recipType ?? "to") === kind)
            .map(r => ({ name: r.name, address: r.smtpAddress ?? r.email }));
    let html = data.bodyHtml;
    if (!html && data.html) {
        html = new TextDecoder().decode(data.html);
    }
    return {
        subject: data.subject,
        from: { name: data.senderName, address: data.senderSmtpAddress ?? data.senderEmail },
        to: pick("to"),
        cc: pick("cc"),
        date: data.messageDeliveryTime ?? data.clientSubmitTime ?? data.creationTime,
        html,
        text: data.body,
        attachments: (data.attachments ?? []).map(att => {
            const file = reader.getAttachment(att);
            return {
                fileName: file.fileName || att.fileName || "attachment",
                mimeType: att.attachMimeTag,
                contentId: stripBrackets(att.pidContentId),
                inline: Boolean(att.pidContentId) && Boolean(att.attachmentHidden),
                content: file.content
            };
        })
    };
}

const REMOTE = /^\s*(https?:)?\/\//i;

export interface SanitizedHtml {
    html: string;
    blockedRemote: number;
}

/**
 * Cleans an email body for display in a sandboxed frame. With blockRemote, remote images and backgrounds are left
 * out (they can track that the message was opened) and counted, so the viewer can offer to load them.
 */
function sanitizeHtml(html: string, blockRemote: boolean): SanitizedHtml {
    let blockedRemote = 0;
    if (blockRemote) {
        DOMPurify.addHook("uponSanitizeAttribute", (_node, data) => {
            if (
                (data.attrName === "src" || data.attrName === "background" || data.attrName === "srcset") &&
                REMOTE.test(data.attrValue)
            ) {
                blockedRemote++;
                data.keepAttr = false;
            } else if (data.attrName === "style" && /url\(\s*['"]?\s*(https?:)?\/\//i.test(data.attrValue)) {
                blockedRemote++;
                data.attrValue = data.attrValue.replace(/url\([^)]*\)/gi, "none");
            }
        });
        DOMPurify.addHook("uponSanitizeElement", node => {
            if (node.nodeName === "STYLE" && node.textContent) {
                const cleaned = node.textContent
                    .replace(/@import[^;]*;/gi, "")
                    .replace(/url\(\s*['"]?\s*(https?:)?\/\/[^)]*\)/gi, "none");
                if (cleaned !== node.textContent) {
                    blockedRemote++;
                    node.textContent = cleaned;
                }
            }
        });
    }
    try {
        const clean = DOMPurify.sanitize(html, {
            WHOLE_DOCUMENT: true,
            FORBID_TAGS: ["form", "input", "button", "textarea", "select"],
            ADD_TAGS: ["style"],
            USE_PROFILES: { html: true }
        });
        return { html: clean, blockedRemote };
    } finally {
        if (blockRemote) {
            DOMPurify.removeHook("uponSanitizeAttribute");
            DOMPurify.removeHook("uponSanitizeElement");
        }
    }
}

const api = { parseEml, parseMsg, sanitizeHtml };
export type EmailEngine = typeof api;

registerEngine("email", api);
