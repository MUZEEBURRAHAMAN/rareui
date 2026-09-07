/**
 * Simulated document content blocks — each corresponds to an outline item.
 * In production, this would be your actual conversation/document content.
 */
export interface ContentBlock {
  id: string;
  heading: string;
  depth: number;
  body: string;
}

export const contentBlocks: ContentBlock[] = [
  {
    id: "s0",
    depth: 0,
    heading: "What happens when something that should be…",
    body: "A product case study exploring how we identified, researched, and solved a critical workflow problem for marketing teams managing product catalogs.",
  },
  {
    id: "s1",
    depth: 1,
    heading: "Project snapshot",
    body: "Timeline: 6 weeks · Team: 4 engineers, 1 designer, 1 PM · Impact: 52% reduction in catalog-related campaign errors.",
  },
  {
    id: "s2",
    depth: 0,
    heading: "Context",
    body: "Before diving into the solution, it's important to understand the ecosystem we were operating in and the forces that shaped this project.",
  },
  {
    id: "s3",
    depth: 1,
    heading: "How product catalogs affect campaigns",
    body: "Marketing teams rely on accurate, up-to-date product catalogs to run campaigns across channels. When catalog data is stale, campaigns break silently. We found that 34% of campaign errors traced back to catalog sync issues.",
  },
  {
    id: "s4",
    depth: 0,
    heading: "Why this matters",
    body: "The cost of catalog-campaign misalignment isn't just operational. It erodes customer trust in ways that are hard to measure and harder to recover from.",
  },
  {
    id: "s5",
    depth: 0,
    heading: "The situation before this project",
    body: "Teams were using a patchwork of CSV exports, manual checks, and calendar reminders to keep catalogs in sync.",
  },
  {
    id: "s6",
    depth: 1,
    heading: "Why this became urgent",
    body: "Three enterprise customers churned in Q2 citing 'data reliability' as the primary reason. Each had experienced catalog-related campaign failures in the 90 days before canceling.",
  },
  {
    id: "s7",
    depth: 1,
    heading: "Why we decided to solve this problem",
    body: "The churn signal, combined with the 34% error-attribution data, made this the highest-leverage project we could take on.",
  },
  {
    id: "s8",
    depth: 0,
    heading: "Target users",
    body: "We identified two distinct user groups whose needs sometimes conflicted, requiring careful design trade-offs.",
  },
  {
    id: "s9",
    depth: 1,
    heading: "The Marketers",
    body: "Campaign managers who need to trust that the products in their campaigns are current. They want a green checkmark, not a data pipeline.",
  },
  {
    id: "s10",
    depth: 2,
    heading: "How internal teams got involved",
    body: "Product, engineering, and customer success formed a cross-functional squad. The CS team brought direct customer quotes that kept the work grounded.",
  },
  {
    id: "s11",
    depth: 1,
    heading: "How it was affecting the product",
    body: "Support tickets related to 'wrong product in campaign' had increased 2.4x quarter-over-quarter. Each ticket averaged 45 minutes to resolve.",
  },
  {
    id: "s12",
    depth: 0,
    heading: "Problem statement",
    body: "Marketing teams cannot confidently launch campaigns because they have no reliable way to verify that their product catalog data is current and consistent across channels.",
  },
  {
    id: "s13",
    depth: 0,
    heading: "Research — digging deeper",
    body: "We conducted 18 user interviews, analyzed 6 months of support tickets, and ran a competitive audit across 12 tools.",
  },
  {
    id: "s14",
    depth: 2,
    heading: "Competitor research and internal observations",
    body: "Most competitors offered basic sync-status dashboards, but none provided proactive alerts before a campaign launched. The gap was clear.",
  },
  {
    id: "s15",
    depth: 0,
    heading: "Constraints & Design decisions",
    body: "We had to work within the existing data pipeline architecture. A full rewrite of the sync engine was out of scope.",
  },
  {
    id: "s16",
    depth: 0,
    heading: "Solution",
    body: "A pre-launch verification layer that automatically checks catalog freshness before any campaign goes live.",
  },
  {
    id: "s17",
    depth: 1,
    heading: "High-level user flow",
    body: "Create campaign → select products → system checks catalog → green/yellow/red status → resolve warnings → campaign launches with audit trail.",
  },
  {
    id: "s18",
    depth: 1,
    heading: "Step 1: Setup — getting the data in",
    body: "We built a lightweight connector framework that pulls catalog data from Shopify, WooCommerce, and custom APIs on a configurable schedule.",
  },
  {
    id: "s19",
    depth: 2,
    heading: "What happens",
    body: "The connector runs a diff against the previous snapshot. Changed products are flagged. Deleted products trigger a scan for active campaigns.",
  },
  {
    id: "s20",
    depth: 2,
    heading: "Design decision",
    body: "We chose snapshot-based diffing over real-time webhooks because it's more reliable across the variety of e-commerce platforms our users connect.",
  },
  {
    id: "s21",
    depth: 1,
    heading: "For Shopify users —",
    body: "Shopify users get a native integration that syncs every 15 minutes by default. The connector understands variant-level changes.",
  },
];
