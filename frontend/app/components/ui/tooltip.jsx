import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import PropTypes from "prop-types";

import { cn } from "@/lib/utils";

const TooltipProvider = ({ children, ...props }) => (
  <TooltipPrimitive.Provider {...props}>{children}</TooltipPrimitive.Provider>
);

TooltipProvider.propTypes = {
  children: PropTypes.node,
};

TooltipProvider.defaultProps = {
  children: undefined,
};

const Tooltip = ({ children, content, side = "top", align = "center", className, ...props }) => (
  <TooltipPrimitive.Root {...props}>
    <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
    <TooltipPrimitive.Content
      side={side}
      align={align}
      sideOffset={4}
      className={cn(
        "z-50 max-w-xs rounded-md bg-muted px-2 py-1 text-sm text-muted-foreground shadow-md",
        className,
      )}
    >
      {content}
      <TooltipPrimitive.Arrow className="fill-muted" />
    </TooltipPrimitive.Content>
  </TooltipPrimitive.Root>
);

Tooltip.displayName = "Tooltip";

Tooltip.propTypes = {
  children: PropTypes.node.isRequired,
  content: PropTypes.node.isRequired,
  side: PropTypes.oneOf(["top", "right", "bottom", "left"]),
  align: PropTypes.oneOf(["start", "center", "end"]),
  className: PropTypes.string,
};

Tooltip.defaultProps = {
  side: "top",
  align: "center",
  className: undefined,
};

const TooltipTrigger = TooltipPrimitive.Trigger;
const TooltipContent = TooltipPrimitive.Content;

export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent };
