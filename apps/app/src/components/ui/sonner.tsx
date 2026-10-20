import { Toaster as Sonner } from "sonner";
import { useTheme } from "@/components/theme-provider";

type ToasterProps = React.ComponentProps<typeof Sonner>;

function Toaster({ ...props }: ToasterProps) {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme === "system" ? "system" : theme}
      className="toaster group"
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "group toast bg-popover text-popover-foreground border border-border shadow-lg rounded-lg",
          description: "text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-muted text-muted-foreground",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
