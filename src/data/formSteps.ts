import type { FormStep } from "@/components/adaptive-form";

export const sampleFormSteps: FormStep[] = [
  {
    id: "basics",
    title: "Let's start with the basics",
    description: "Tell us about your project so we can tailor the experience.",
    fields: [
      {
        id: "projectName",
        label: "Project name",
        type: "text",
        placeholder: "My awesome project",
      },
      {
        id: "projectType",
        label: "What are you building?",
        type: "radio",
        options: [
          { value: "webapp", label: "Web app" },
          { value: "mobile", label: "Mobile" },
          { value: "saas", label: "SaaS" },
          { value: "other", label: "Other" },
        ],
      },
      {
        id: "framework",
        label: "Framework",
        type: "select",
        placeholder: "Pick a framework",
        showWhen: { field: "projectType", values: ["webapp", "saas"] },
        options: [
          { value: "next", label: "Next.js" },
          { value: "remix", label: "Remix" },
          { value: "vite", label: "Vite + React" },
          { value: "astro", label: "Astro" },
        ],
      },
      {
        id: "platform",
        label: "Target platform",
        type: "radio",
        showWhen: { field: "projectType", values: ["mobile"] },
        options: [
          { value: "ios", label: "iOS" },
          { value: "android", label: "Android" },
          { value: "cross", label: "Cross-platform" },
        ],
      },
    ],
  },
  {
    id: "team",
    title: "About your team",
    description: "This helps us recommend the right plan and integrations.",
    fields: [
      {
        id: "teamSize",
        label: "Team size",
        type: "radio",
        options: [
          { value: "solo", label: "Just me" },
          { value: "small", label: "2–5" },
          { value: "medium", label: "6–20" },
          { value: "large", label: "20+" },
        ],
      },
      {
        id: "role",
        label: "Your role",
        type: "select",
        placeholder: "Select your role",
        options: [
          { value: "eng", label: "Engineer" },
          { value: "design", label: "Designer" },
          { value: "pm", label: "Product manager" },
          { value: "founder", label: "Founder" },
        ],
      },
      {
        id: "hiring",
        label: "Are you hiring?",
        type: "radio",
        showWhen: { field: "teamSize", values: ["small", "medium", "large"] },
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          { value: "maybe", label: "Maybe soon" },
        ],
      },
    ],
  },
  {
    id: "details",
    title: "One last thing",
    description: "Anything else you'd like us to know?",
    fields: [
      {
        id: "timeline",
        label: "When do you need this?",
        type: "radio",
        options: [
          { value: "now", label: "Right now" },
          { value: "week", label: "This week" },
          { value: "month", label: "This month" },
          { value: "exploring", label: "Just exploring" },
        ],
      },
      {
        id: "notes",
        label: "Additional notes",
        type: "textarea",
        placeholder: "Tell us more about what you're looking for…",
      },
    ],
  },
];
