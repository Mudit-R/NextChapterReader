import React from "react";
import PropTypes from 'prop-types';
import { OTPInput } from "input-otp";
import { cn } from "@/lib/utils";

const InputOTP = React.forwardRef(({ className, ...props }, ref) => (
  <OTPInput ref={ref} className={cn("flex items-center gap-2", className)} {...props} />
));

InputOTP.displayName = "InputOTP";

InputOTP.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};

const InputOTPGroup = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center", className)} {...props} />
));

InputOTPGroup.displayName = "InputOTPGroup";

InputOTPGroup.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
};

const InputOTPSlot = React.forwardRef(({ char, hasFakeCaret, isActive, className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "relative h-10 w-10 rounded-md border text-sm ring-offset-background transition-all",
        "flex items-center justify-center",
        "focus-within:z-10 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        isActive && "z-10 ring-2 ring-ring ring-offset-2",
        className
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="animate-caret-blink h-4 w-px bg-foreground duration-1000" />
        </div>
      )}
    </div>
  );
});

InputOTPSlot.displayName = "InputOTPSlot";

InputOTPSlot.propTypes = {
  char: PropTypes.string,
  hasFakeCaret: PropTypes.bool,
  isActive: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
};

const InputOTPSeparator = React.forwardRef(({ ...props }, ref) => (
  <hr ref={ref} {...props} />
));

InputOTPSeparator.displayName = "InputOTPSeparator";

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };