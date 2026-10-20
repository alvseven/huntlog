import { Database } from "bun:sqlite";
import path from "node:path";

const [dbPath, outPath = "legacy-export.json"] = process.argv.slice(2);
if (!dbPath) {
  console.error("Usage: bun scripts/export-legacy.ts <huntlog.sqlite3> [out.json]");
  process.exit(1);
}

const db = new Database(dbPath, { readonly: true });
const all = (sql: string) => db.query(sql).all() as Record<string, unknown>[];

const resumesDir = path.join(path.dirname(dbPath), "resumes");
const resumes = await Promise.all(
  all("select * from resumes").map(async (r) => {
    const file = Bun.file(path.join(resumesDir, String(r.stored_path)));
    const exists = await file.exists();
    return {
      id: r.id,
      label: r.label,
      original_filename: r.original_filename,
      uploaded_at: r.uploaded_at,
      mime_type: exists ? file.type.split(";")[0] : "application/pdf",
      data: exists ? Buffer.from(await file.arrayBuffer()).toString("base64") : null,
    };
  })
);

const tagLinks = all(
  "select at.application_id, t.name from application_tags at join tags t on t.id = at.tag_id"
);

const applications = all("select * from applications").map((a) => ({
  ...a,
  tags: tagLinks.filter((l) => l.application_id === a.id).map((l) => l.name),
}));

const data = {
  format: "huntlog-export",
  version: 1,
  exported_at: new Date().toISOString(),
  resumes,
  applications,
  prep_notes: all("select * from prep_notes"),
  leads: all("select * from leads"),
  resources: all("select * from resources"),
};

await Bun.write(outPath, JSON.stringify(data, null, 2));
console.log(
  `Exported ${applications.length} applications, ${data.prep_notes.length} notes, ${data.leads.length} leads, ${data.resources.length} resources, ${resumes.length} resumes to ${outPath}`
);
