import { createContext, useContext, useId } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const FieldIdContext = createContext<string | undefined>(undefined);

export const useFieldId = () => useContext(FieldIdContext);

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label id={`${id}-label`} htmlFor={id}>
        {label}
      </Label>
      <FieldIdContext.Provider value={id}>{children}</FieldIdContext.Provider>
    </div>
  );
}
