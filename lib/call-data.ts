import { text, type Lead } from "./crm-data";
export const emptyLead: Lead = {
  id: "",
  name: text("No contact selected", "مخاطبی انتخاب نشده"),
  initials: "·",
  company: text("", ""),
  role: text("", ""),
  phone: "",
  email: "",
  color: "#d6cdea",
  status: "new",
  score: 0,
  value: 0,
  source: text("CRM", "CRM"),
  interest: text("Discovery conversation", "گفت‌وگوی آشنایی"),
  note: text("", ""),
  scenario: text(
    "Introduce yourself, ask about their goals and agree on a next step.",
    "خودتان را معرفی کنید، اهداف را بشناسید و قدم بعدی را مشخص کنید.",
  ),
};
