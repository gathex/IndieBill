"use client";

import { Button, type ButtonProps } from "@/components/ui/button";

interface ConfirmSubmitButtonProps extends ButtonProps {
  confirmMessage: string;
}

export function ConfirmSubmitButton({
  confirmMessage,
  onClick,
  children,
  ...props
}: ConfirmSubmitButtonProps) {
  return (
    <Button
      {...props}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
    >
      {children}
    </Button>
  );
}
