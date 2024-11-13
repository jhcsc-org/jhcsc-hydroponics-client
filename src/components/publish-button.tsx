import { Button } from "@aws-amplify/ui-react";
import { usePublish } from "../hooks/usePublish";


interface PublishButtonProps {
  actionName: string;
  message: Record<string | symbol, unknown>;
  topic: string | string[];
  className?: string;
  disabled?: boolean;
  options?: {
    provider?: string | symbol;
    [key: string]: unknown;
  };
}

export function PublishButton({
  actionName,
  message,
  topic,
  className,
  disabled = false,
  options,
}: PublishButtonProps) {
  const publish = Array.isArray(topic) 
    ? usePublish<Record<string | symbol, unknown>>(topic, message, options)
    : usePublish<Record<string | symbol, unknown>>([topic], message, options);
  return (
    <Button
      onClick={publish}
      className={className}
      disabled={disabled}
    >
      {actionName}
    </Button>
  );
}
