import { cn } from "@/lib/utils";

interface StepProgressProps {
  currentStep: number;
}

const steps = [
  { number: 1, label: "Config" },
  { number: 2, label: "Customer" },
  { number: 3, label: "Products" },
  { number: 4, label: "Review" },
];

export function StepProgress({ currentStep }: StepProgressProps) {
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-4 mb-4 sm:mb-8 flex-wrap px-2">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center gap-1 sm:gap-2">
          <div className="flex items-center gap-1 sm:gap-2">
            <div
              className={cn(
                "w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-sm sm:text-base md:text-lg transition-all duration-300",
                currentStep === step.number
                  ? "bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white shadow-lg shadow-primary/40"
                  : currentStep > step.number
                  ? "bg-primary/20 text-primary border-2 border-primary"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-400"
              )}
              data-testid={`step-indicator-${step.number}`}
            >
              {step.number}
            </div>
            <span className="font-semibold text-white text-xs sm:text-sm hidden sm:inline">{step.label}</span>
          </div>
          {index < steps.length - 1 && (
            <div className="w-6 sm:w-8 md:w-12 h-0.5 sm:h-1 bg-white/30 rounded hidden sm:block" />
          )}
        </div>
      ))}
    </div>
  );
}
