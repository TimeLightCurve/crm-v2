"use client";
import {
  ArrowUpRight,
  ChevronRight,
  Phone,
  Target,
  TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";
import type { Locale } from "@/lib/crm-data";

export default function Metrics({
  locale,
  completed,
  followupCount,
  onFollowups,
}: {
  locale: Locale;
  completed: number;
  followupCount: number;
  onFollowups: () => void;
}) {
  const t = (en: string, fa: string) => (locale === "en" ? en : fa);
  return (
    <section
      className={
        "metrics-grid grid grid-cols-[1.45fr_1fr_1fr_1.05fr] gap-4 max-[1250px]:gap-3 max-[1250px]:grid-cols-[1.3fr_1fr_0.95fr_1fr] max-[1050px]:grid-cols-[repeat(4,_1fr)] max-[780px]:grid-cols-[1fr_1fr] max-[780px]:gap-3 max-[520px]:gap-2.25"
      }
      aria-label={t("Sales overview", "نمای کلی فروش")}
    >
      <motion.article
        className={
          "metric-card pipeline-card rounded-[18px] bg-[#d5e1cf] min-w-0 p-[19px_20px_14px] relative overflow-hidden min-h-[151px] text-start [&_.metric-footer]:mt-4 min-[1500px]:min-h-[175px] min-[1500px]:p-[22px_24px] max-[1250px]:p-[17px_16px_13px] max-[780px]:min-h-[150px] max-[520px]:rounded-[13px] max-[520px]:p-[14px_12px_12px] max-[520px]:min-h-[143px]"
        }
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div
          className={
            "metric-top flex justify-between items-start gap-2.5 text-sm [&>span:first-child]:flex [&>span:first-child]:items-center [&>span:first-child]:gap-2 [&_svg]:text-[#697660] max-[1050px]:text-sm max-[780px]:text-sm max-[520px]:text-xs max-[520px]:[&>span:first-child]:gap-1 max-[520px]:[&_svg]:w-3"
          }
        >
          <span>
            <TrendingUp size={15} />
            {t("Your pipeline", "پایپ‌لاین شما")}
          </span>
          <ArrowUpRight size={18} />
        </div>
        <div
          className={
            "pipeline-body flex items-center mt-6.25 relative [&>div]:z-1 [&_.metric-number]:text-4xl [&_.metric-number]:whitespace-nowrap [&_p]:text-xs [&_p]:text-[#7b8971] [&_p]:mt-2.5 min-[1500px]:[&_.metric-number]:text-[38px] max-[1250px]:[&_.metric-number]:text-4xl max-[1050px]:[&_.metric-number]:text-3xl max-[780px]:[&_.metric-number]:text-4xl max-[520px]:mt-5.75 max-[520px]:[&_.metric-number]:text-3xl max-[520px]:[&_p]:leading-[1.5] [&_.growth]:text-xs"
          }
        >
          <div>
            <div
              className={
                "metric-number text-4xl tracking-[-1.7px] font-normal leading-[1] [&_small]:text-lg [&_small]:tracking-0 [&_small]:text-[#a2a896] [&_small]:ms-1.5 max-[1050px]:text-4xl max-[1050px]:[&_small]:text-sm max-[520px]:text-4xl max-[520px]:[&_small]:text-sm"
              }
            >
              $24,800
              <span
                className={
                  "growth inline-block text-xs tracking-0 align-middle ms-2.25 rounded-[5px] p-[4px_6px] bg-[#e6f1df] text-[#5e7953] max-[1250px]:ms-1.25 max-[1050px]:hidden max-[780px]:inline-block max-[520px]:hidden"
                }
              >
                ↗ 18.6%
              </span>
            </div>
            <p>
              {t(
                "Good conversations. Real growth.",
                "گفت‌وگوهای خوب، رشد واقعی.",
              )}
            </p>
          </div>
          <svg
            className={
              "pipeline-chart w-[32%] h-[57px] absolute right-[-4px] top-2.5 opacity-75 rtl:right-auto rtl:left-[-4px] max-[1250px]:opacity-30 max-[1250px]:w-[36%] max-[1050px]:hidden max-[780px]:block max-[780px]:opacity-60 max-[520px]:hidden"
            }
            viewBox="0 0 200 72"
            fill="none"
            aria-label={t("Pipeline trending up", "روند صعودی پایپ‌لاین")}
          >
            <path
              d="M0 63H200M0 35H200M0 7H200"
              stroke="#a6bda9"
              strokeDasharray="2 5"
              opacity=".6"
            />
            <path
              d="M2 63C22 63 21 45 40 48S62 64 80 42S100 51 119 29S141 40 159 17S181 26 197 5"
              stroke="#456b4e"
              strokeWidth="2.5"
            />
            <circle cx="197" cy="5" r="4" fill="#456b4e" />
          </svg>
        </div>
        <div
          className={
            "metric-footer flex items-center justify-between text-xs text-[#8b9580] mt-5 max-[520px]:mt-4.5"
          }
        >
          <span>{t("This month", "این ماه")}</span>
          <span>{t("vs. last month", "نسبت به ماه گذشته")}</span>
        </div>
      </motion.article>
      <motion.article
        className={
          "metric-card calls-card rounded-[18px] bg-[#fbfcf8] min-w-0 p-[19px_20px_14px] relative overflow-hidden min-h-[151px] text-start min-[1500px]:min-h-[175px] min-[1500px]:p-[22px_24px] max-[1250px]:p-[17px_16px_13px] max-[780px]:min-h-[150px] max-[520px]:rounded-[13px] max-[520px]:p-[14px_12px_12px] max-[520px]:min-h-[143px]"
        }
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
      >
        <div
          className={
            "metric-top flex justify-between items-start gap-2.5 text-sm [&>span:first-child]:flex [&>span:first-child]:items-center [&>span:first-child]:gap-2 [&_svg]:text-[#697660] max-[1050px]:text-sm max-[780px]:text-sm max-[520px]:text-xs max-[520px]:[&>span:first-child]:gap-1 max-[520px]:[&_svg]:w-3"
          }
        >
          <span>
            <Phone size={15} />
            {t("Calls made", "تماس‌های امروز")}
          </span>
          <span
            className={"tiny-label text-[#9ba18f] text-xs tracking-[0.6px]"}
          >
            {t("TODAY", "امروز")}
          </span>
        </div>
        <div
          className={
            "calls-body flex items-end justify-between gap-3.25 mt-6 max-[1050px]:gap-1.5 max-[520px]:mt-6"
          }
        >
          <div
            className={
              "metric-number text-4xl tracking-[-1.7px] font-normal leading-[1] [&_small]:text-lg [&_small]:tracking-0 [&_small]:text-[#a2a896] [&_small]:ms-1.5 max-[1050px]:text-4xl max-[1050px]:[&_small]:text-sm max-[520px]:text-4xl max-[520px]:[&_small]:text-sm"
            }
          >
            {18 + completed}
            <small>/ 25</small>
          </div>
          <div
            className={
              "mini-bars flex items-end h-10.75 gap-0.75 overflow-hidden max-w-[102px] flex-1 [&_i]:w-0.5 [&_i]:flex-1 [&_i]:min-w-0.5 [&_i]:rounded-[2px] max-[1050px]:max-w-[68px] max-[1050px]:gap-0.5 max-[520px]:max-w-[45px]"
            }
          >
            {[
              23, 37, 28, 46, 34, 52, 40, 60, 46, 30, 48, 38, 54, 43, 65, 48,
              58, 43, 35, 43, 31, 45, 32, 39, 26,
            ].map((v, i) => (
              <i
                key={i}
                style={{
                  height: v * 0.65,
                  background: i < 18 + completed ? "#343b34" : "#e7eae5",
                }}
              />
            ))}
          </div>
        </div>
        <div
          className={
            "metric-footer flex items-center justify-between text-xs text-[#8b9580] mt-5 max-[520px]:mt-4.5"
          }
        >
          <span className={"positive text-[#798b68]"}>
            ↗ {t("4 more than yesterday", "۴ تماس بیشتر از دیروز")}
          </span>
        </div>
      </motion.article>
      <motion.button
        className={
          "metric-card followup-card rounded-[18px] bg-[#e5edae] min-w-0 p-[19px_20px_14px] relative overflow-hidden min-h-[151px] text-start [&_.metric-top]:text-sm [&_.metric-top]:leading-[1.5] [&_.metric-top>span]:max-w-[153px] [&_.metric-footer]:text-[#7e865d] [&_.metric-footer]:mt-3.75 min-[1500px]:min-h-[175px] min-[1500px]:p-[22px_24px] max-[1250px]:p-[17px_16px_13px] max-[780px]:min-h-[150px] max-[520px]:rounded-[13px] max-[520px]:p-[14px_12px_12px] max-[520px]:min-h-[143px] max-[520px]:[&_.metric-top]:text-xs max-[520px]:[&_.metric-number]:text-3xl"
        }
        onClick={onFollowups}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        whileHover={{ y: -3 }}
      >
        <div
          className={
            "metric-top flex justify-between items-start gap-2.5 text-sm [&>span:first-child]:flex [&>span:first-child]:items-center [&>span:first-child]:gap-2 [&_svg]:text-[#697660] max-[1050px]:text-sm max-[780px]:text-sm max-[520px]:text-xs max-[520px]:[&>span:first-child]:gap-1 max-[520px]:[&_svg]:w-3"
          }
        >
          <span>
            {t(
              "A little follow-up goes a long way.",
              "یک پیگیری کوچک، یک فرصت بزرگ.",
            )}
          </span>
          <ArrowUpRight size={18} />
        </div>
        <div
          className={
            "followup-body flex items-center justify-between mt-3.75 max-[520px]:mt-4.75"
          }
        >
          <div
            className={
              "avatar-stack flex ps-1 [&_span]:h-7.5 [&_span]:w-7.5 [&_span]:grid [&_span]:place-items-center [&_span]:border-2 [&_span]:border-[#e5edae] [&_span]:rounded-full [&_span]:text-xs [&_span]:ms-[-5px] [&_span]:bg-[#d6c1a5] [&_span]:text-[#695742] [&_span:nth-child(2)]:bg-[#c5cdbb] [&_span:nth-child(2)]:text-[#526248] [&_span:last-child]:bg-[#eff4cf] [&_span:last-child]:text-[#788055] max-[520px]:[&_span]:w-6 max-[520px]:[&_span]:h-6"
            }
          >
            <span>SA</span>
            <span>RM</span>
          </div>
          <div
            className={
              "metric-number text-4xl tracking-[-1.7px] font-normal leading-[1] [&_small]:text-lg [&_small]:tracking-0 [&_small]:text-[#a2a896] [&_small]:ms-1.5 max-[1050px]:text-4xl max-[1050px]:[&_small]:text-sm max-[520px]:text-4xl max-[520px]:[&_small]:text-sm"
            }
          >
            {String(followupCount).padStart(2, "0")}
          </div>
        </div>
        <div
          className={
            "metric-footer flex items-center justify-between text-xs text-[#8b9580] mt-5 max-[520px]:mt-4.5"
          }
        >
          <span>{t("Leads waiting for you", "لیدها منتظر شما هستند")}</span>
          <ChevronRight size={16} />
        </div>
      </motion.button>
      <motion.article
        className={
          "metric-card goal-card rounded-[18px] bg-[#fbfcf8] min-w-0 p-[19px_20px_14px] relative overflow-hidden min-h-[151px] text-start min-[1500px]:min-h-[175px] min-[1500px]:p-[22px_24px] max-[1250px]:p-[17px_16px_13px] max-[780px]:min-h-[150px] max-[520px]:rounded-[13px] max-[520px]:p-[14px_12px_12px] max-[520px]:min-h-[143px]"
        }
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
      >
        <div
          className={
            "metric-top flex justify-between items-start gap-2.5 text-sm [&>span:first-child]:flex [&>span:first-child]:items-center [&>span:first-child]:gap-2 [&_svg]:text-[#697660] max-[1050px]:text-sm max-[780px]:text-sm max-[520px]:text-xs max-[520px]:[&>span:first-child]:gap-1 max-[520px]:[&_svg]:w-3"
          }
        >
          <span>
            <Target size={15} />
            {t("Monthly target", "هدف ماهانه")}
          </span>
          <span
            className={"tiny-label text-[#9ba18f] text-xs tracking-[0.6px]"}
          >
            {t("OCT", "مهر")}
          </span>
        </div>
        <div
          className={
            "goal-body flex items-center gap-4 mt-4.5 [&_strong]:text-sm [&_strong]:font-medium [&_p]:text-xs [&_p]:text-[#979e8c] [&_p]:mt-1.25 [&_p]:whitespace-nowrap max-[1250px]:gap-2 max-[1250px]:[&_p]:text-xs max-[1050px]:gap-1.25 max-[1050px]:[&_strong]:text-xs max-[1050px]:[&_p]:[white-space:normal] max-[1050px]:[&_p]:leading-[1.5] max-[780px]:gap-3.75 max-[780px]:mt-5 max-[780px]:[&_strong]:text-sm max-[780px]:[&_p]:text-sm max-[520px]:gap-1.5 max-[520px]:mt-5.75 max-[520px]:[&_strong]:text-xs max-[520px]:[&_p]:text-xs"
          }
        >
          <div
            className={
              "goal-ring w-19 h-19 relative shrink-0 [&_svg]:w-full [&_svg]:h-full [&>span]:absolute [&>span]:inset-0 [&>span]:flex [&>span]:items-center [&>span]:justify-center [&>span]:text-3xl [&>span]:tracking-[-1px] [&_small]:text-base [&_small]:mt-1.5 max-[1250px]:w-16 max-[1250px]:h-16 max-[1050px]:w-13.75 max-[1050px]:h-13.75 max-[1050px]:[&>span]:text-3xl max-[780px]:w-17.5 max-[780px]:h-17.5 max-[520px]:w-[51px] max-[520px]:h-[51px] max-[520px]:[&>span]:text-2xl max-[520px]:[&_small]:text-xs"
            }
          >
            <svg viewBox="0 0 90 90">
              <circle
                cx="45"
                cy="45"
                r="37"
                fill="none"
                stroke="#e7eae3"
                strokeWidth="7"
              />
              <circle
                cx="45"
                cy="45"
                r="37"
                fill="none"
                stroke="#7a9170"
                strokeWidth="7"
                strokeDasharray="177 233"
                strokeLinecap="round"
                transform="rotate(-90 45 45)"
              />
            </svg>
            <span>
              76<small>%</small>
            </span>
          </div>
          <div>
            <strong>{t("Almost there.", "نزدیک هدف هستید.")}</strong>
            <p>{t("Keep the momentum.", "با همین انرژی ادامه دهید.")}</p>
            <span
              className={
                "target-chip inline-block p-[4px_7px] bg-[#f0f2e9] rounded-[5px] text-xs mt-2.5 [&_span]:text-[#9aa18f] max-[520px]:p-[3px_4px] max-[520px]:mt-1.5"
              }
            >
              $19k <span>/ $25k</span>
            </span>
          </div>
        </div>
      </motion.article>
    </section>
  );
}
