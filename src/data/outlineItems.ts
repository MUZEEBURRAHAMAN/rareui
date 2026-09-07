import type { OutlineItem } from "@/components/edge-stepper";

/**
 * Sample outline data — mirrors ChatGPT's hierarchical conversation structure.
 * In production, this would be generated from your content's heading tree.
 */
export const sampleOutline: OutlineItem[] = [
  { id: "s0", depth: 0, label: "What happens when something that should be…" },
  { id: "s1", depth: 1, label: "Project snapshot", isLink: true },
  { id: "s2", depth: 0, label: "Context" },
  { id: "s3", depth: 1, label: "How product catalogs affect campaigns", hasExpand: true },
  { id: "s4", depth: 0, label: "Why this matters" },
  { id: "s5", depth: 0, label: "The situation before this project" },
  { id: "s6", depth: 1, label: "Why this became urgent" },
  { id: "s7", depth: 1, label: "Why we decided to solve this problem" },
  { id: "s8", depth: 0, label: "Target users" },
  { id: "s9", depth: 1, label: "The Marketers" },
  { id: "s10", depth: 2, label: "How internal teams got involved", hasExpand: true },
  { id: "s11", depth: 1, label: "How it was affecting the product" },
  { id: "s12", depth: 0, label: "Problem statement" },
  { id: "s13", depth: 0, label: "Research — digging deeper" },
  { id: "s14", depth: 2, label: "Competitor research and internal observations", hasExpand: true },
  { id: "s15", depth: 0, label: "Constraints & Design decisions" },
  { id: "s16", depth: 0, label: "Solution" },
  { id: "s17", depth: 1, label: "High-level user flow" },
  { id: "s18", depth: 1, label: "Step 1: Setup — getting the data in" },
  { id: "s19", depth: 2, label: "What happens" },
  { id: "s20", depth: 2, label: "Design decision" },
  { id: "s21", depth: 1, label: "For Shopify users —" },
];
