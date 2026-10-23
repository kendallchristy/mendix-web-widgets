// The list of typing and keyboard shortcuts shown in the help popover.
import type { ReactElement, ReactNode } from "react";

import type { ShortcutSection } from "../core/shortcuts";

export interface HelpContentProps {
    title: string;
    titleId: string;
    sections: ShortcutSection[];
    custom?: ReactNode;
}

export function HelpContent({ title, titleId, sections, custom }: HelpContentProps): ReactElement {
    return (
        <div className="dpp-help">
            <h2 className="dpp-help__title" id={titleId}>
                {title}
            </h2>
            {custom ??
                sections.map(section => (
                    <section key={section.id} className="dpp-help__section">
                        <h3 className="dpp-help__heading">{section.title}</h3>
                        <dl className="dpp-help__list">
                            {section.items.map((item, index) => (
                                <div key={index} className="dpp-help__item">
                                    <dt className="dpp-help__keys">
                                        {item.keys.map((key, k) => (
                                            <kbd key={k} className="dpp-help__key">
                                                {key}
                                            </kbd>
                                        ))}
                                    </dt>
                                    <dd className="dpp-help__description">{item.description}</dd>
                                </div>
                            ))}
                        </dl>
                    </section>
                ))}
        </div>
    );
}
