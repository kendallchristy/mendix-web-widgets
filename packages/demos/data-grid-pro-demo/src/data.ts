import type { MockItem } from "./mendix-mock/list";

export interface Competitor extends MockItem {
    domain: string;
    backlinks: number;
    flags: string[];
    score: number;
    grade: string;
    country: string;
    ht: number;
    htCount: number;
    tt: number;
    contract: number;
    active: boolean;
}

export interface Keyword extends MockItem {
    owner: Competitor;
    text: string;
    color: string;
}

const NAMES = [
    "devops",
    "newstack",
    "dzone",
    "puppet",
    "hashicorp",
    "atlassian",
    "gitlab",
    "circleci",
    "jenkins",
    "docker",
    "ansible",
    "openshift",
    "pagerduty",
    "splunk",
    "datadog",
    "grafana",
    "vercel",
    "netlify",
    "render",
    "railway",
    "fly",
    "supabase",
    "neon",
    "planetscale",
    "sentry",
    "linear",
    "notion",
    "figma",
    "retool",
    "airtable"
];
const TLDS = ["com", "io", "dev", "co", "app"];
const FLAGS = ["Purchased", "Sponsored", "PPC", "Geo-Targeted"];
const COUNTRIES = ["US", "UK", "BR", "CH", "SW", "DE", "NL", "FR", "JP", "IN"];
const KEYWORDS = [
    "ci/cd",
    "kubernetes",
    "observability",
    "terraform",
    "gitops",
    "serverless",
    "edge",
    "postgres",
    "monitoring",
    "security",
    "devex",
    "platform",
    "cloud",
    "testing",
    "deploys"
];
const COLORS = ["blue", "green", "purple", "orange", "gray"];

/** Deterministic pseudo-random numbers, so every run shows the same data. */
function random(seed: number): () => number {
    let state = seed;
    return () => {
        state = (state * 1664525 + 1013904223) % 4294967296;
        return state / 4294967296;
    };
}

export function generate(count: number): { competitors: Competitor[]; keywords: Keyword[] } {
    const next = random(42);
    const pick = <T>(list: T[]): T => list[Math.floor(next() * list.length)];
    const competitors: Competitor[] = [];
    const keywords: Keyword[] = [];
    for (let i = 0; i < count; i++) {
        const score = Math.floor(40 + next() * 60);
        const flags = FLAGS.filter(() => next() < 0.45);
        const ht = Math.floor(next() * 100);
        const competitor: Competitor = {
            id: `c${i}`,
            domain: `www.${pick(NAMES)}${i > NAMES.length ? i : ""}.${pick(TLDS)}`,
            backlinks: Math.floor(next() * 8000),
            flags: flags.length ? flags : ["Purchased"],
            score,
            grade: score >= 95 ? "A" : score >= 88 ? "B" : score >= 70 ? "C" : "F",
            country: pick(COUNTRIES),
            ht,
            htCount: Math.floor(ht * 40000 + next() * 10000),
            tt: Math.floor(next() * 100),
            contract: Math.floor(500 + next() * 12000),
            active: next() > 0.3
        };
        competitors.push(competitor);
        const keywordCount = Math.floor(next() * 9);
        for (let k = 0; k < keywordCount; k++) {
            keywords.push({ id: `k${i}-${k}`, owner: competitor, text: pick(KEYWORDS), color: pick(COLORS) });
        }
    }
    return { competitors, keywords };
}
