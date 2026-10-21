export type Locale = "en" | "fa";
export type Localized = { en: string; fa: string };
export const text = (en: string, fa: string): Localized => ({ en, fa });
export type LeadStatus =
  "negotiating" | "new" | "followup" | "noanswer" | "won";
export interface TranscriptLine {
  speaker: "agent" | "client";
  time: string;
  content: Localized;
}
export interface Lead {
  id: string;
  name: Localized;
  initials: string;
  company: Localized;
  role: Localized;
  phone: string;
  email: string;
  color: string;
  status: LeadStatus;
  score: number;
  value: number;
  source: Localized;
  interest: Localized;
  note: Localized;
  scenario: Localized;
}
export const statusLabels: Record<LeadStatus, Localized> = {
  negotiating: text("In negotiation", "در حال مذاکره"),
  new: text("New lead", "لید جدید"),
  followup: text("Follow-up", "نیاز به پیگیری"),
  noanswer: text("No answer", "عدم پاسخ"),
  won: text("Won", "موفق"),
};
export const leads: Lead[] = [
  {
    id: "LD-2041",
    name: text("Mohsen Taghavi", "محسن تقوی"),
    initials: "MT",
    company: text("Individual · Data analytics", "شخصی · تحلیل داده"),
    role: text("Career development", "توسعه مسیر شغلی"),
    phone: "+98 912 660 7080",
    email: "m.taghavi@example.com",
    color: "#cbdcca",
    status: "negotiating",
    score: 72,
    value: 2400,
    source: text("Telegram campaign", "کمپین تلگرام"),
    interest: text("Data analytics bootcamp", "بوت‌کمپ تحلیل داده"),
    note: text(
      "Interested in a career change. Price-sensitive; offered an installment plan. Prefers evening classes.",
      "به تغییر مسیر شغلی علاقه‌مند است. روی قیمت حساس است؛ پرداخت اقساطی پیشنهاد شد. کلاس عصر را ترجیح می‌دهد.",
    ),
    scenario: text(
      "Start with their career goals. Connect the bootcamp’s real-world projects to those goals, then walk through the flexible payment options.",
      "با اهداف شغلی شروع کنید. پروژه‌های واقعی بوت‌کمپ را به این اهداف مرتبط کنید، سپس شرایط پرداخت اقساطی را توضیح دهید.",
    ),
  },
  {
    id: "LD-2042",
    name: text("Sara Ahmadi", "سارا احمدی"),
    initials: "SA",
    company: text("Nava Studio · Design", "استودیو نوا · طراحی"),
    role: text("Design lead", "مدیر طراحی"),
    phone: "+98 935 214 6082",
    email: "s.ahmadi@example.com",
    color: "#e9d6c6",
    status: "followup",
    score: 86,
    value: 4800,
    source: text("Website inquiry", "فرم وب‌سایت"),
    interest: text("Team training program", "برنامه آموزش تیم"),
    note: text(
      "Looking for training for a team of four. Send the team package and arrange a demo.",
      "برای تیم چهار نفره به دنبال آموزش است. بسته تیمی ارسال و جلسه معرفی هماهنگ شود.",
    ),
    scenario: text(
      "Ask about the team’s current workflow. Show how a tailored training plan can close their skills gap.",
      "درباره روند فعلی تیم سؤال کنید. توضیح دهید برنامه آموزشی اختصاصی چگونه مهارت‌های تیم را تقویت می‌کند.",
    ),
  },
  {
    id: "LD-2043",
    name: text("Amir Hosseini", "امیر حسینی"),
    initials: "AH",
    company: text("Orbit Tech · Software", "اوربیت تک · نرم‌افزار"),
    role: text("Product manager", "مدیر محصول"),
    phone: "+98 919 345 2710",
    email: "a.hosseini@example.com",
    color: "#c8d8e5",
    status: "new",
    score: 64,
    value: 1800,
    source: text("Referral", "معرفی دوستان"),
    interest: text("Product analytics course", "دوره تحلیل محصول"),
    note: text(
      "Referred by a past participant. Wants to understand the course schedule and prerequisites.",
      "از طریق شرکت‌کننده قبلی معرفی شده است. درباره برنامه دوره و پیش‌نیازها سؤال دارد.",
    ),
    scenario: text(
      "Introduce yourself and mention the referral. Explore their product analytics experience and recommend a learning path.",
      "خودتان را معرفی کنید و به معرف اشاره کنید. تجربه تحلیل محصول و مسیر یادگیری مناسب را بررسی کنید.",
    ),
  },
  {
    id: "LD-2044",
    name: text("Niloofar Karimi", "نیلوفر کریمی"),
    initials: "NK",
    company: text("Bloom · E-commerce", "بلوم · تجارت الکترونیک"),
    role: text("Marketing specialist", "کارشناس بازاریابی"),
    phone: "+98 921 771 3940",
    email: "n.karimi@example.com",
    color: "#ddd0e4",
    status: "negotiating",
    score: 91,
    value: 3200,
    source: text("Instagram campaign", "کمپین اینستاگرام"),
    interest: text("Marketing analytics program", "دوره تحلیل بازاریابی"),
    note: text(
      "Ready to enroll after manager approval. Follow up with the program outline.",
      "پس از تأیید مدیر آماده ثبت‌نام است. سرفصل دوره برای پیگیری ارسال شود.",
    ),
    scenario: text(
      "Confirm the approval process. Offer a concise program outline they can share with their manager.",
      "روند تأیید را مشخص کنید. خلاصه سرفصل‌ها را برای ارائه به مدیر آماده کنید.",
    ),
  },
  {
    id: "LD-2045",
    name: text("Reza Moradi", "رضا مرادی"),
    initials: "RM",
    company: text("Freelance · Development", "فریلنسر · توسعه"),
    role: text("Frontend developer", "توسعه‌دهنده فرانت‌اند"),
    phone: "+98 912 842 1056",
    email: "r.moradi@example.com",
    color: "#e3dfb9",
    status: "noanswer",
    score: 58,
    value: 1600,
    source: text("Website inquiry", "فرم وب‌سایت"),
    interest: text("Advanced Python course", "دوره پیشرفته پایتون"),
    note: text(
      "Needs a weekend schedule. Call back with the next cohort’s availability.",
      "به برنامه آخر هفته نیاز دارد. زمان دوره بعدی را اطلاع دهید.",
    ),
    scenario: text(
      "Check their weekend availability and explain the practical projects included in the course.",
      "زمان آزاد آخر هفته و پروژه‌های عملی دوره را بررسی کنید.",
    ),
  },
  {
    id: "LD-2046",
    name: text("Parisa Ebrahimi", "پریسا ابراهیمی"),
    initials: "PE",
    company: text("Peyk · Logistics", "پیک · لجستیک"),
    role: text("Operations analyst", "تحلیلگر عملیات"),
    phone: "+98 933 529 7601",
    email: "p.ebrahimi@example.com",
    color: "#cbd8cf",
    status: "new",
    score: 78,
    value: 2800,
    source: text("LinkedIn", "لینکدین"),
    interest: text("Business intelligence course", "دوره هوش تجاری"),
    note: text(
      "Interested in reporting automation and dashboards. First discovery call pending.",
      "به اتوماسیون گزارش‌دهی و داشبورد علاقه‌مند است. تماس آشنایی هنوز انجام نشده.",
    ),
    scenario: text(
      "Explore their reporting challenges and the tools they use. Introduce relevant dashboard projects.",
      "چالش‌های گزارش‌دهی و ابزارهای فعلی را بررسی و پروژه‌های داشبورد مرتبط را معرفی کنید.",
    ),
  },
];
export function getTranscript(lead: Lead): TranscriptLine[] {
  return [
    {
      speaker: "agent",
      time: "00:04",
      content: text(
        `Hi ${lead.name.en.split(" ")[0]}! This is Negar from Forma. Is now a good time to talk?`,
        `سلام ${lead.name.fa}، نگار هستم از فرما. الان فرصت دارید صحبت کنیم؟`,
      ),
    },
    {
      speaker: "client",
      time: "00:12",
      content: text(
        `Hi! Yes, I wanted to learn more about the ${lead.interest.en.toLowerCase()}.`,
        `سلام! بله، می‌خواستم درباره ${lead.interest.fa} بیشتر بدانم.`,
      ),
    },
    {
      speaker: "agent",
      time: "00:28",
      content: text(
        "Of course. What would you like to achieve with the program?",
        "حتماً. دوست دارید با شرکت در این دوره به چه هدفی برسید؟",
      ),
    },
    {
      speaker: "client",
      time: "00:42",
      content: text(
        "I want to build practical skills and work on real projects. The cost is my main concern.",
        "می‌خواهم مهارت عملی کسب کنم و روی پروژه واقعی کار کنم. نگرانی اصلی من هزینه دوره است.",
      ),
    },
    {
      speaker: "agent",
      time: "01:05",
      content: text(
        "That makes sense. The program includes hands-on projects, and we offer a flexible installment plan.",
        "کاملاً قابل درک است. دوره پروژه‌های عملی دارد و می‌توانید از پرداخت اقساطی استفاده کنید.",
      ),
    },
    {
      speaker: "client",
      time: "01:24",
      content: text(
        "That would help! Could you send me the schedule and payment details?",
        "خیلی خوب است! می‌توانید برنامه کلاس‌ها و شرایط پرداخت را بفرستید؟",
      ),
    },
    {
      speaker: "agent",
      time: "01:38",
      content: text(
        "Absolutely. I’ll send you both today and follow up tomorrow. Thank you for your time!",
        "حتماً. امروز هر دو را می‌فرستم و فردا پیگیری می‌کنم. ممنون از وقتی که گذاشتید!",
      ),
    },
  ];
}
export const waveform = Array.from(
  { length: 44 },
  (_, i) => 5 + ((i * 13 + i * i * 7) % 24),
);
