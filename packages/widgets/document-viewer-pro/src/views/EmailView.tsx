import { useCallback, useEffect, useMemo, useState, type ReactElement } from "react";

import { downloadBytes } from "../core/download";
import { loadEngine } from "../core/engines";
import { detectKind } from "../core/fileTypes";
import type { EmailAddress, EmailAttachment, ParsedEmail } from "../engines/email";
import { reflowScale, useDomSearch } from "./hooks";
import { SandboxFrame } from "./SandboxFrame";
import type { ViewProps } from "./types";

type EmailEngine = Awaited<ReturnType<typeof loadEngine<"email">>>;

function formatAddress(address: EmailAddress): string {
    if (address.name && address.address && address.name !== address.address) {
        return `${address.name} <${address.address}>`;
    }
    return address.name || address.address || "";
}

function formatDate(value: string | undefined): string {
    if (!value) {
        return "";
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function formatSize(bytes: number): string {
    if (bytes < 1024) {
        return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
        return `${Math.round(bytes / 1024)} KB`;
    }
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function escapeHtml(text: string): string {
    return text.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);
}

/** Points cid: references at the inline attachments, after sanitizing (which leaves cid: links alone). */
function linkInlineImages(html: string, attachments: EmailAttachment[], urls: string[]): string {
    const byId = new Map<string, string>();
    attachments.forEach((attachment, i) => {
        if (attachment.contentId) {
            byId.set(attachment.contentId.toLowerCase(), urls[i]);
        }
    });
    if (byId.size === 0) {
        return html;
    }
    return html.replace(/(src|background)=(["'])cid:([^"']+)\2/gi, (match, attr: string, quote: string, id: string) => {
        const url = byId.get(decodeURIComponent(id).toLowerCase());
        return url ? `${attr}=${quote}${url}${quote}` : match;
    });
}

export function EmailView(props: ViewProps): ReactElement | null {
    const { file, callbacks, labels, zoom, query, activeMatch, allowCopy } = props;
    const [mail, setMail] = useState<ParsedEmail | null>(null);
    const [engine, setEngine] = useState<EmailEngine | null>(null);
    const [showRemote, setShowRemote] = useState(!props.blockRemoteImages);
    const [doc, setDoc] = useState<Document | null>(null);
    const [version, setVersion] = useState(0);

    useEffect(() => {
        let cancelled = false;
        loadEngine("email")
            .then(async loaded => {
                if (cancelled || !file.bytes) {
                    return;
                }
                const parsed = file.ext === "msg" ? loaded.parseMsg(file.bytes) : await loaded.parseEml(file.bytes);
                if (cancelled) {
                    return;
                }
                setEngine(loaded);
                setMail(parsed);
            })
            .catch(() => {
                if (!cancelled) {
                    callbacks.onError();
                }
            });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [file]);

    const attachmentUrls = useMemo(
        () =>
            (mail?.attachments ?? []).map(a =>
                URL.createObjectURL(
                    new Blob([a.content as BlobPart], { type: a.mimeType ?? "application/octet-stream" })
                )
            ),
        [mail]
    );
    useEffect(() => () => attachmentUrls.forEach(url => URL.revokeObjectURL(url)), [attachmentUrls]);

    const body = useMemo(() => {
        if (!mail || !engine) {
            return null;
        }
        if (mail.html) {
            const clean = engine.sanitizeHtml(mail.html, !showRemote);
            return {
                html: linkInlineImages(clean.html, mail.attachments, attachmentUrls),
                blocked: clean.blockedRemote
            };
        }
        const text = escapeHtml(mail.text ?? "");
        return {
            html: `<pre style="white-space: pre-wrap; font: 14px/1.5 system-ui, sans-serif; margin: 0">${text}</pre>`,
            blocked: 0
        };
    }, [mail, engine, showRemote, attachmentUrls]);

    const header = useMemo((): Array<[string, string]> => {
        if (!mail) {
            return [];
        }
        const rows: Array<[string, string]> = [
            [labels.from, mail.from ? formatAddress(mail.from) : ""],
            [labels.to, mail.to.map(formatAddress).join(", ")],
            [labels.cc, mail.cc.map(formatAddress).join(", ")],
            [labels.date, formatDate(mail.date)]
        ];
        return rows.filter(([, value]) => value);
    }, [mail, labels]);

    useEffect(() => {
        if (!mail || !body) {
            return;
        }
        callbacks.onReady({
            zoomable: true,
            fits: false,
            rotatable: false,
            searchable: true,
            print: async () => ({
                kind: "html",
                html: `<h2>${escapeHtml(mail.subject ?? "")}</h2><table>${header
                    .map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`)
                    .join("")}</table><hr>${body.html}`,
                css: "th { text-align: left; padding-right: 12px; color: #555; font-weight: 500; } table { margin-bottom: 8px; }"
            })
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mail, body]);

    const scale = reflowScale(zoom);
    useEffect(() => {
        callbacks.onScale(scale);
    }, [scale, callbacks]);

    const onDocument = useCallback((loaded: Document) => {
        setDoc(loaded);
        setVersion(v => v + 1);
    }, []);
    useDomSearch(() => doc?.body, query, activeMatch, version, callbacks.onMatches);

    const openAttachment = (attachment: EmailAttachment): void => {
        const kind = detectKind(attachment.fileName, attachment.content).kind;
        if (kind === "unknown") {
            downloadBytes(attachment.content, attachment.fileName, attachment.mimeType);
        } else {
            callbacks.onOpenAttachment({ name: attachment.fileName, bytes: attachment.content });
        }
    };

    if (!mail || !body) {
        return null;
    }
    const listed = mail.attachments.filter(a => !a.inline || !a.contentId);
    return (
        <div className="dvp-email" style={{ fontSize: `${14 * scale}px` }}>
            <header className="dvp-email-header">
                <h2 className="dvp-email-subject">{mail.subject}</h2>
                <dl className="dvp-email-meta">
                    {header.map(([label, value]) => (
                        <div key={label} className="dvp-email-row">
                            <dt>{label}</dt>
                            <dd>{value}</dd>
                        </div>
                    ))}
                </dl>
                {listed.length > 0 && (
                    <div className="dvp-email-attachments" aria-label={labels.attachments}>
                        {listed.map(attachment => (
                            <button
                                key={`${attachment.fileName}-${attachment.content.length}`}
                                type="button"
                                className="dvp-attachment"
                                onClick={() => openAttachment(attachment)}
                            >
                                <span className="dvp-attachment-name">{attachment.fileName}</span>
                                <span className="dvp-attachment-size">{formatSize(attachment.content.length)}</span>
                            </button>
                        ))}
                    </div>
                )}
            </header>
            {body.blocked > 0 && !showRemote && (
                <div className="dvp-note" role="note">
                    <span>{labels.remoteBlocked}</span>
                    <button type="button" className="btn btn-default btn-sm" onClick={() => setShowRemote(true)}>
                        {labels.showRemote}
                    </button>
                </div>
            )}
            <div className="dvp-email-body">
                <SandboxFrame
                    html={body.html}
                    title={mail.subject ?? file.name}
                    scale={scale}
                    allowCopy={allowCopy}
                    autoHeight
                    onDocument={onDocument}
                />
            </div>
        </div>
    );
}
