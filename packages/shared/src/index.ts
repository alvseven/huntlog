export const STAGES = [
  "applied",
  "assessment",
  "recruiter_screen",
  "technical_interview",
  "offer",
  "rejected",
  "accepted",
] as const;

export type Stage = (typeof STAGES)[number];

export const CLOSED_STAGES: Stage[] = ["rejected", "accepted"];

export const STAGE_LABELS: Record<Stage, string> = {
  applied: "Applied",
  assessment: "Assessment",
  recruiter_screen: "Recruiter Screen",
  technical_interview: "Technical Interview",
  offer: "Offer",
  rejected: "Rejected",
  accepted: "Accepted",
};

export const SOURCES = [
  "referral",
  "cold_outreach",
  "recruiter",
  "job_board",
  "company_website",
  "x_twitter",
  "linkedin",
  "warm_intro",
  "other",
] as const;

export type Source = (typeof SOURCES)[number];

export const SOURCE_LABELS: Record<Source, string> = {
  referral: "Referral",
  cold_outreach: "Cold Outreach",
  recruiter: "Recruiter",
  job_board: "Job Board",
  company_website: "Company Website",
  x_twitter: "X / Twitter",
  linkedin: "LinkedIn",
  warm_intro: "Warm Intro",
  other: "Other",
};

export interface Tag {
  id: string;
  name: string;
}

export interface Resume {
  id: string;
  label: string;
  original_filename: string;
  uploaded_at: string;
}

export interface ResourceLink {
  id: string;
  label: string;
  url: string;
  notes: string | null;
  created_at: string;
}

export type ResourceLinkInput = Omit<ResourceLink, "id" | "created_at">;
export type ResourceLinkUpdate = Partial<ResourceLinkInput>;

export interface Application {
  id: string;
  company: string;
  role: string;
  job_link: string | null;
  source: string | null;
  date_applied: string;
  stage: Stage;
  next_action: string | null;
  next_action_due: string | null;
  contact_name: string | null;
  contact_info: string | null;
  comp_range: string | null;
  resume_id: string | null;
  resume: Resume | null;
  tags: Tag[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicationWriteFields {
  company: string;
  role: string;
  job_link: string | null;
  source: string | null;
  date_applied: string;
  stage: Stage;
  next_action: string | null;
  next_action_due: string | null;
  contact_name: string | null;
  contact_info: string | null;
  comp_range: string | null;
  resume_id: string | null;
  notes: string | null;
}

export type ApplicationInput = ApplicationWriteFields & { tagNames?: string[] };
export type ApplicationUpdate = Partial<ApplicationWriteFields> & { tagNames?: string[] };

export interface PrepNote {
  id: string;
  application_id: string;
  stage: string;
  note: string;
  created_at: string;
}

export type PrepNoteInput = Omit<PrepNote, "id" | "created_at">;

export interface Lead {
  id: string;
  company: string;
  role: string | null;
  link: string | null;
  source: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type LeadInput = Omit<Lead, "id" | "created_at" | "updated_at">;
export type LeadUpdate = Partial<LeadInput>;

export interface StatsResponse {
  activeApplications: number;
  appliedLast7Days: number;
  appliedLast30Days: number;
  totalLeads: number;
  responseRate: number;
  funnel: Record<Stage, number>;
  overdueFollowUps: Application[];
}
