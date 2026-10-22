import { render, screen } from "@testing-library/react";

import { Caption } from "../components/Caption";

describe("Caption", () => {
    it("renders the text", () => {
        render(<Caption text="Hello" />);
        expect(screen.getByText("Hello")).toBeInTheDocument();
    });

    it("merges a custom class name", () => {
        render(<Caption className="extra" text="Hello" />);
        expect(screen.getByText("Hello")).toHaveClass("widget-template-widget", "extra");
    });
});
