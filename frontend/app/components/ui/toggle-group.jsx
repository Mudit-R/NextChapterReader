import * as React from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle";
import PropTypes from "prop-types";

import { cn } from "@/lib/utils";
import { toggleVariants } from "./toggle";

const ToggleGroup = React.forwardRef(({ className, type = "single", children, ...props }, ref) => (
  <ToggleGroupPrimitive.Root ref={ref} className={cn("inline-flex", className)} type={type} {...props}>
    {children}
  </ToggleGroupPrimitive.Root>
));

ToggleGroup.displayName = "ToggleGroup";

ToggleGroup.propTypes = {
  className: PropTypes.string,
  type: PropTypes.oneOf(["single", "multiple"]),
  children: PropTypes.node,
};

ToggleGroup.defaultProps = {
  className: undefined,
  type: "single",
  children: undefined,
};

const ToggleGroupItem = React.forwardRef(({ className, value, variant, size, ...props }, ref) => (
  <ToggleGroupPrimitive.Item
    ref={ref}
    className={cn(toggleVariants({ variant, size, className }))}
    value={value}
    {...props}
  />
));

ToggleGroupItem.displayName = "ToggleGroupItem";

ToggleGroupItem.propTypes = {
  className: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  variant: PropTypes.string,
  size: PropTypes.string,
  children: PropTypes.node,
};

ToggleGroupItem.defaultProps = {
  className: undefined,
  variant: "default",
  size: "default",
  children: undefined,
};

export { ToggleGroup, ToggleGroupItem };
