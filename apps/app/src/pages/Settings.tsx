import { useRef, useState } from "react";
import { toast } from "sonner";
import { Copy, Eye, EyeOff, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { forgetIdentity, getStoredMnemonic } from "@/lib/evolu";
import { importExport } from "@/lib/import";

export default function Settings() {
  const [showPhrase, setShowPhrase] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const phrase = getStoredMnemonic() ?? "";

  const copyPhrase = async () => {
    await navigator.clipboard.writeText(phrase);
    toast.success("Recovery phrase copied");
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setImporting(true);
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warnBeforeLeaving);
    try {
      const s = await importExport(await file.text());
      toast.success(
        `Imported ${s.applications} applications, ${s.leads} leads, ${s.resources} resources, ${s.resumes} resumes and ${s.notes} notes`
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally {
      window.removeEventListener("beforeunload", warnBeforeLeaving);
      setImporting(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const removeFromDevice = () => {
    if (
      !window.confirm(
        "Remove huntlog from this device? You'll need your recovery phrase to get your data back."
      )
    )
      return;
    forgetIdentity();
    window.location.href = "/";
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Recovery phrase</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This phrase is the only key to your data. Use it to open huntlog on another device. Keep
            it somewhere safe: if you lose it, nobody can recover your data, including us.
          </p>
          <div className="rounded-lg border border-border bg-muted/40 p-4 font-mono text-sm leading-relaxed">
            {showPhrase ? phrase : phrase.replace(/\S/g, "•")}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowPhrase((v) => !v)}>
              {showPhrase ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              {showPhrase ? "Hide" : "Show"}
            </Button>
            <Button variant="outline" onClick={copyPhrase}>
              <Copy className="size-4" />
              Copy
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Import</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Import a huntlog export file (.json). Imported items are added next to what you already
            have.
          </p>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
          <Button variant="outline" disabled={importing} onClick={() => fileInput.current?.click()}>
            <Upload className="size-4" />
            {importing ? "Importing…" : "Choose file"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>This device</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Removing huntlog from this device signs it out. Your synced data stays available on your
            other devices and with your recovery phrase.
          </p>
          <Button variant="destructive" onClick={removeFromDevice}>
            Remove from this device
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
