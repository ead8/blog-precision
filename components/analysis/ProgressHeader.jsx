import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";

export default function ProgressHeader({ steps, currentStep }) {
  return (
    <div className="p-4">
      <div className="flex items-center">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex items-center text-slate-900 relative">
              <motion.div
                animate={{
                  backgroundColor: index <= currentStep ? "#3b82f6" : "#e2e8f0",
                  color: index <= currentStep ? "#ffffff" : "#475569"
                }}
                transition={{ duration: 0.3 }}
                className="rounded-full w-8 h-8 flex items-center justify-center font-bold z-10"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={index < currentStep ? "check" : "number"}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.2 }}
                  >
                    {index < currentStep ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
              <div className="absolute top-0 -ml-10 text-center mt-10 w-32 text-xs font-medium uppercase text-slate-700">
                {step.title}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className="flex-auto border-t-2 transition duration-500 ease-in-out border-slate-300">
                 <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: index < currentStep ? '100%' : '0%' }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="h-full bg-blue-600"
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}