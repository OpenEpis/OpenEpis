import type { BddStep } from "@openepis/types";
import { cn } from "@/lib/utils";

const stepStyles: Record<string, string> = {
  given: "text-green-700 bg-green-50",
  when: "text-blue-700 bg-blue-50",
  then: "text-purple-700 bg-purple-50",
  and: "text-gray-600 bg-gray-50",
};

const stepKeywords: Record<string, string> = {
  given: "Given",
  when: "When",
  then: "Then",
  and: "And",
};

interface BddStepsProps {
  steps: BddStep[];
}

export function BddSteps({ steps }: BddStepsProps) {
  return (
    <div className="space-y-1.5">
      {steps.map((step, i) => (
        <div key={i} className="flex items-baseline gap-2 text-sm">
          <span
            className={cn(
              "inline-block w-14 shrink-0 rounded px-1.5 py-0.5 text-center text-xs font-semibold",
              stepStyles[step.type] || stepStyles.and,
            )}
          >
            {stepKeywords[step.type] || step.type}
          </span>
          <span>{step.text}</span>
        </div>
      ))}
    </div>
  );
}
