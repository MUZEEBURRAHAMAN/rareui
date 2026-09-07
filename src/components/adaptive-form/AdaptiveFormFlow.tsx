"use client";

import { memo, type ReactNode } from "react";
import {
  useAdaptiveForm,
  type FormStep,
} from "./useAdaptiveForm";
import { StepIndicator } from "./StepIndicator";
import { FormFieldRow } from "./FormField";

interface AdaptiveFormFlowProps {
  steps: FormStep[];
  onSubmit?: (values: Record<string, string>) => void;
  children?: ReactNode;
}

/**
 * AdaptiveFormFlow — a multi-step form that reveals fields based on prior
 * answers.
 *
 * Each step can declare `showWhen` on its fields so they only appear once
 * the user has picked a qualifying value in an earlier field. Steps auto-
 * advance when every visible field has a value, and a progress rail tracks
 * where you are.
 */
export const AdaptiveFormFlow = memo(function AdaptiveFormFlow({
  steps,
  onSubmit,
}: AdaptiveFormFlowProps) {
  const {
    currentStep,
    stepCount,
    step,
    visibleFields,
    values,
    setValue,
    canGoBack,
    canGoNext,
    isLastStep,
    goNext,
    goBack,
  } = useAdaptiveForm({ steps });

  const handleSubmit = () => {
    if (isLastStep) onSubmit?.(values);
    else goNext();
  };

  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* ── Progress ── */}
        <div className="mb-6 flex items-center justify-between">
          <StepIndicator current={currentStep} total={stepCount} />
          <span className="font-mono text-[11px] tabular-nums text-ink-4">
            {currentStep + 1}/{stepCount}
          </span>
        </div>

        {/* ── Step header ── */}
        <div
          key={step.id}
          className="animate-step-in"
        >
          <h3 className="text-[15px] font-semibold tracking-tight text-ink">
            {step.title}
          </h3>
          {step.description && (
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink-3">
              {step.description}
            </p>
          )}
        </div>

        {/* ── Fields ── */}
        <div className="mt-5 flex flex-col gap-4">
          {visibleFields.map((field, i) => (
            <FormFieldRow
              key={field.id}
              field={field}
              value={values[field.id] ?? ""}
              onChange={(v) => setValue(field.id, v)}
              index={i}
            />
          ))}
        </div>

        {/* ── Navigation ── */}
        <div className="mt-6 flex items-center gap-2">
          {canGoBack && (
            <button
              type="button"
              onClick={goBack}
              className="rounded-control border border-line px-4 py-2 text-[13px] font-medium text-ink-3
                transition-colors duration-150 hover:bg-hover hover:text-ink"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canGoNext}
            className="ml-auto rounded-control bg-accent px-5 py-2 text-[13px] font-medium text-white
              transition-all duration-150 hover:opacity-90
              disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isLastStep ? "Submit" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
});
