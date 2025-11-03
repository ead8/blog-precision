"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const Progress = React.forwardRef(({ className, value, ...props }, ref) => {
  const progressValue = Math.max(0, Math.min(100, Number(value) || 0));
  
  // Use state to ensure smooth updates and enforce monotonic progress
  const [displayValue, setDisplayValue] = React.useState(() => progressValue);
  
  React.useEffect(() => {
    // Use functional update to avoid stale closure issues
    setDisplayValue(prev => {
      // Only update if new value is greater (monotonic - never decrease)
      if (progressValue > prev) {
        console.log(`[Progress Component] Updating displayValue: ${prev}% -> ${progressValue}%`);
        return progressValue;
      }
      // Reset to 0 if explicitly set (for new analyses)
      if (progressValue === 0 && prev > 0) {
        console.log(`[Progress Component] Resetting displayValue to 0`);
        return 0;
      }
      // Keep previous value if no update needed
      return prev;
    });
  }, [progressValue]);
  
  // Calculate width percentage for the fill bar
  const widthPercent = `${displayValue}%`;
  
  console.log(`[Progress Component] Render - value prop: ${value}, progressValue: ${progressValue}%, displayValue: ${displayValue}%, width: ${widthPercent}`);
  
  return (
    <div
      ref={ref}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full",
        className
      )}
      {...props}
      style={{
        backgroundColor: '#e2e8f0', // bg-slate-200
        ...props.style
      }}
    >
      <div
        key={`progress-fill-${Math.floor(displayValue)}`}
        style={{
          height: '100%',
          width: widthPercent,
          backgroundColor: '#2563eb', // bg-blue-600
          borderRadius: '9999px', // rounded-full
          minWidth: displayValue > 0 ? '2px' : '0px',
          transition: 'width 0.5s ease-out',
          willChange: 'width',
          display: 'block'
        }}
        data-progress={displayValue}
      />
    </div>
  );
})
Progress.displayName = "Progress"

export { Progress }
