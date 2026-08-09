import * as TooltipPrimitive from '@radix-ui/react-tooltip';

export function TooltipProvider({ children }) {
  return <TooltipPrimitive.Provider delayDuration={150}>{children}</TooltipPrimitive.Provider>;
}

export function Tooltip({ label, children }) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          sideOffset={8}
          className="z-[1000] rounded border border-[#1d465d] bg-[#061725] px-2.5 py-1.5 text-xs text-[#d9eef4] shadow-xl"
        >
          {label}
          <TooltipPrimitive.Arrow className="fill-[#1d465d]" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
