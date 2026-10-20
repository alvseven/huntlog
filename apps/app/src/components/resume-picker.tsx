import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowUpRight, FileText, Upload } from "lucide-react";
import type { Resume } from "@huntlog/shared";
import { useApi } from "@/lib/api-context";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useDataVersion } from "@/lib/use-data-version";
const NONE = "__none__";

export function ResumePicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const api = useApi();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => api.listResumes().then(setResumes);

  const version = useDataVersion();
  useEffect(() => {
    load();
  }, [version]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const resume = await api.uploadResume(file);
      await load();
      onChange(resume.id);
      toast.success(`Uploaded ${resume.label}`);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const selected = resumes.find((r) => r.id === value) ?? null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Select value={value ?? NONE} onValueChange={(v) => onChange(v === NONE ? null : v)}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="No resume selected" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>No resume</SelectItem>
            {resumes.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
          <Upload className="size-4" />
          {uploading ? "Uploading…" : "Upload"}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={handleFile}
        />
      </div>
      {selected && (
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            void api.openResume(selected.id);
          }}
          className="inline-flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
        >
          <FileText className="size-3.5" />
          View {selected.original_filename}
          <ArrowUpRight className="size-3" />
        </a>
      )}
    </div>
  );
}
