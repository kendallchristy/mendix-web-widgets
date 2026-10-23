import { render, screen } from "@testing-library/react";

import { Pills, Progress } from "../components/cells";

describe("Pills", () => {
    const pills = ["SEO", "Ads", "Content", "Social", "Email"].map(caption => ({
        key: caption,
        caption,
        color: "blue" as const
    }));

    it("shows three pills and counts the rest", () => {
        const { container } = render(<Pills pills={pills} />);
        expect(screen.getByText("SEO")).toBeInTheDocument();
        expect(screen.queryByText("Social")).not.toBeInTheDocument();
        expect(screen.getByText("+2")).toBeInTheDocument();
        expect(container.firstElementChild).toHaveAttribute("data-dgp-tip", "SEO\nAds\nContent\nSocial\nEmail");
    });

    it("needs no tooltip when every pill fits", () => {
        const { container } = render(<Pills pills={pills.slice(0, 2)} />);
        expect(container.firstElementChild).not.toHaveAttribute("data-dgp-tip");
    });

    it("renders nothing for an empty list", () => {
        const { container } = render(<Pills pills={[]} />);
        expect(container).toBeEmptyDOMElement();
    });
});

describe("Progress", () => {
    it("shows the value as a percentage of the maximum", () => {
        render(<Progress value={45} max={60} />);
        expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "75");
        expect(screen.getByText("75%")).toBeInTheDocument();
    });

    it("keeps values inside 0 to 100 percent", () => {
        render(<Progress value={500} max={100} />);
        expect(screen.getByText("100%")).toBeInTheDocument();
    });

    it("shows 0% when the maximum is 0", () => {
        render(<Progress value={5} max={0} />);
        expect(screen.getByText("0%")).toBeInTheDocument();
    });
});
