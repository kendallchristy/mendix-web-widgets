import { fillText } from "../text";
import { sizeLearner } from "../react/sizeLearner";

describe("fillText", () => {
    it("fills known placeholders and leaves unknown ones", () => {
        expect(fillText("[item] at [position] of [count] in [where]", { item: "Card", position: 2, count: 5 })).toBe(
            "Card at 2 of 5 in [where]"
        );
    });
});

describe("sizeLearner", () => {
    it("starts from the guess and then averages measured sizes", () => {
        const sizes = [40, 60];
        const learner = sizeLearner(100, () => sizes.shift() ?? 0);
        expect(learner.estimateSize()).toBe(100);
        expect(learner.measureElement()).toBe(40);
        expect(learner.estimateSize()).toBe(40);
        learner.measureElement();
        expect(learner.estimateSize()).toBe(50);
        // Zero sizes (hidden elements) are ignored.
        learner.measureElement();
        expect(learner.estimateSize()).toBe(50);
    });
});
