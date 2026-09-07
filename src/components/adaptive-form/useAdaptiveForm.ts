"use client";

import { useCallback, useMemo, useState } from "react";

export interface FormField {
  id: string;
  label: string;
  type: "text" | "select" | "radio" | "textarea";
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  /** Only show this field when a prior field has one of these values */
  showWhen?: { field: string; values: string[] };
}

export interface FormStep {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
}

interface UseAdaptiveFormOptions {
  steps: FormStep[];
}

interface UseAdaptiveFormReturn {
  currentStep: number;
  stepCount: number;
  step: FormStep;
  visibleFields: FormField[];
  values: Record<string, string>;
  setValue: (fieldId: string, value: string) => void;
  canGoBack: boolean;
  canGoNext: boolean;
  isLastStep: boolean;
  goNext: () => void;
  goBack: () => void;
  progress: number;
}

export function useAdaptiveForm({
  steps,
}: UseAdaptiveFormOptions): UseAdaptiveFormReturn {
  const [currentStep, setCurrentStep] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});

  const step = steps[currentStep];

  const visibleFields = useMemo(
    () =>
      step.fields.filter((f) => {
        if (!f.showWhen) return true;
        const v = values[f.showWhen.field];
        return v !== undefined && f.showWhen.values.includes(v);
      }),
    [step.fields, values],
  );

  const setValue = useCallback((fieldId: string, value: string) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  }, []);

  const canGoBack = currentStep > 0;

  const canGoNext = useMemo(() => {
    return visibleFields.every((f) => {
      const v = values[f.id];
      return v !== undefined && v.trim() !== "";
    });
  }, [visibleFields, values]);

  const isLastStep = currentStep === steps.length - 1;

  const goNext = useCallback(() => {
    if (currentStep < steps.length - 1) setCurrentStep((s) => s + 1);
  }, [currentStep, steps.length]);

  const goBack = useCallback(() => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }, [currentStep]);

  const progress = (currentStep + 1) / steps.length;

  return {
    currentStep,
    stepCount: steps.length,
    step,
    visibleFields,
    values,
    setValue,
    canGoBack,
    canGoNext,
    isLastStep,
    goNext,
    goBack,
    progress,
  };
}
