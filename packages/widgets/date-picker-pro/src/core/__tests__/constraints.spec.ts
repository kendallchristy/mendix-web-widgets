import { checkRange, createDayTest, createPendingEndTest, isPeriodDisabled, timeOptions } from "../constraints";

const day = (m: number, d: number): Date => new Date(2026, m - 1, d);

describe("createDayTest", () => {
    it("applies min and max by day", () => {
        const test = createDayTest({
            min: new Date(2026, 0, 10, 15),
            max: day(1, 20)
        });
        expect(test(day(1, 9))).toBe(true);
        expect(test(new Date(2026, 0, 10, 8))).toBe(false);
        expect(test(day(1, 20))).toBe(false);
        expect(test(day(1, 21))).toBe(true);
    });

    it("disables weekdays", () => {
        const test = createDayTest({
            disabledWeekdays: [true, false, false, false, false, false, true]
        });
        expect(test(day(1, 10))).toBe(true); // Saturday
        expect(test(day(1, 12))).toBe(false); // Monday
    });

    it("includes or excludes specific days", () => {
        const days = [day(1, 5), day(1, 6)];
        expect(createDayTest({ specificDays: { mode: "include", days } })(day(1, 7))).toBe(true);
        expect(createDayTest({ specificDays: { mode: "include", days } })(day(1, 5))).toBe(false);
        expect(createDayTest({ specificDays: { mode: "exclude", days } })(day(1, 5))).toBe(true);
    });

    it("includes or excludes intervals", () => {
        const ranges = [{ start: day(2, 1), end: day(2, 10) }];
        expect(createDayTest({ intervals: { mode: "exclude", ranges } })(day(2, 10))).toBe(true);
        expect(createDayTest({ intervals: { mode: "exclude", ranges } })(day(2, 11))).toBe(false);
        expect(createDayTest({ intervals: { mode: "include", ranges } })(day(2, 11))).toBe(true);
    });
});

describe("isPeriodDisabled", () => {
    it("allows a month with one open day", () => {
        const test = createDayTest({
            specificDays: { mode: "include", days: [day(3, 31)] }
        });
        expect(isPeriodDisabled(day(3, 1), "month", test)).toBe(false);
        expect(isPeriodDisabled(day(4, 1), "month", test)).toBe(true);
    });
});

describe("timeOptions", () => {
    it("steps through the day within min and max", () => {
        expect(timeOptions(60, { min: 9 * 60, max: 12 * 60 })).toEqual([540, 600, 660, 720]);
    });
    it("adds included specific times between steps", () => {
        expect(
            timeOptions(60, {
                min: 600,
                max: 660,
                specificTimes: { mode: "include", times: [630] }
            })
        ).toEqual([630]);
        expect(
            timeOptions(30, {
                min: 600,
                max: 660,
                specificTimes: { mode: "exclude", times: [630] }
            })
        ).toEqual([600, 660]);
    });
});

describe("range rules", () => {
    const open = (): boolean => false;
    it("counts both ends", () => {
        expect(checkRange(day(1, 1), day(1, 7), "day", { maxLength: 7 }, open)).toBeUndefined();
        expect(checkRange(day(1, 1), day(1, 8), "day", { maxLength: 7 }, open)).toBe("tooLong");
        expect(checkRange(day(1, 1), day(1, 2), "day", { minLength: 3 }, open)).toBe("tooShort");
    });

    it("finds disabled days inside", () => {
        const test = createDayTest({
            specificDays: { mode: "exclude", days: [day(1, 4)] }
        });
        expect(checkRange(day(1, 1), day(1, 7), "day", { excludeDisabled: true }, test)).toBe("crossesDisabled");
        expect(checkRange(day(1, 5), day(1, 7), "day", { excludeDisabled: true }, test)).toBeUndefined();
    });

    it("blocks ends that can't complete the range", () => {
        const test = createDayTest({
            specificDays: { mode: "exclude", days: [day(1, 10)] }
        });
        const blocked = createPendingEndTest(day(1, 5), "day", { maxLength: 4, excludeDisabled: true }, test);
        expect(blocked(day(1, 8))).toBe(false);
        expect(blocked(day(1, 9))).toBe(true); // 5 days
        expect(blocked(day(1, 2))).toBe(false);
        const crossing = createPendingEndTest(day(1, 5), "day", { excludeDisabled: true }, test);
        expect(crossing(day(1, 9))).toBe(false);
        expect(crossing(day(1, 11))).toBe(true);
    });
});
