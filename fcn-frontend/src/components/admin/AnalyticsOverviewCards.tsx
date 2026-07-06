import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Users, CalendarCheck, UserCheck, Stethoscope, CheckCircle, Building2, Pill, DollarSign } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { StaggerChildren, StaggerItem } from "@/components/animations/StaggerChildren";
import type { AnalyticsOverview } from "@/services/admin.service";

interface Props {
  overview: AnalyticsOverview;
  onPendingClick?: () => void;
  onSettingsClick?: () => void;
}

function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(ref.current, { textContent: 0 }, {
      textContent: value,
      duration: 1.2,
      ease: "power2.out",
      snap: { textContent: 1 },
      delay: 0.3,
    });
  }, [value]);

  return <span ref={ref}>{prefix}{value}{suffix}</span>;
}

export const AnalyticsOverviewCards = ({ overview, onPendingClick, onSettingsClick }: Props) => {
  const cards = [
    {
      icon: <Users className="h-5 w-5 text-fcn-accent" />,
      label: "Total Users",
      value: overview.total_users,
      growth: `+${overview.total_users_growth}% this month`,
      growthPositive: overview.total_users_growth >= 0,
    },
    {
      icon: <CalendarCheck className="h-5 w-5 text-fcn-accent" />,
      label: "Appointments Today",
      value: overview.appointments_today,
      subtext: `this week: ${overview.appointments_this_week}`,
    },
    {
      icon: <UserCheck className="h-5 w-5 text-fcn-warning" />,
      label: "Pending Approvals",
      value: overview.pending_approvals,
      pulse: overview.pending_approvals > 0,
      onClick: overview.pending_approvals > 0 ? onPendingClick : undefined,
    },
    {
      icon: <Stethoscope className="h-5 w-5 text-fcn-accent" />,
      label: "Active Doctors",
      value: overview.total_doctors,
      subtext: "available for consultations",
    },
    {
      icon: <CheckCircle className="h-5 w-5 text-fcn-success" />,
      label: "Completion Rate",
      value: overview.completion_rate,
      suffix: "%",
      subtext: `${overview.completed_consultations}/${overview.total_appointments} consultations`,
    },
    {
      icon: <Building2 className="h-5 w-5 text-fcn-accent" />,
      label: "Partner Hospitals",
      value: overview.active_hospitals,
      subtext: "active hospitals",
    },
    {
      icon: <Pill className="h-5 w-5 text-fcn-accent" />,
      label: "Partner Pharmacies",
      value: overview.active_pharmacies,
      subtext: "active pharmacies",
    },
    {
      icon: <DollarSign className={`h-5 w-5 ${overview.revenue_this_month > 0 ? "text-fcn-success" : "text-fcn-text-light/40"}`} />,
      label: "Revenue This Month",
      value: overview.revenue_this_month,
      prefix: "Br ",
      subtext: overview.revenue_this_month === 0 ? "Payment not active yet" : undefined,
      onClick: overview.revenue_this_month === 0 ? onSettingsClick : undefined,
      badge: overview.revenue_this_month === 0 ? "Activate \u2192" : undefined,
    },
  ];

  return (
    <StaggerChildren>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {cards.map((card, i) => (
        <StaggerItem key={i}>
          <Card
            hoverable={!!card.onClick}
            className={card.pulse ? "border-fcn-warning/50 animate-pulse" : undefined}
            onClick={card.onClick}
          >
            <div className="flex items-center justify-between">
              <div className="rounded-md bg-fcn-primary/5 p-2">{card.icon}</div>
              {card.badge && (
                <span className="rounded-full bg-fcn-warning/20 px-2 py-0.5 text-[10px] font-medium text-fcn-warning">
                  {card.badge}
                </span>
              )}
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
                <AnimatedNumber value={card.value} prefix={card.prefix || ""} suffix={card.suffix || ""} />
              </div>
              <div className="text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">{card.label}</div>
              {card.growth && (
                <div className={`mt-1 text-xs font-medium ${card.growthPositive ? "text-fcn-success" : "text-fcn-danger"}`}>
                  {card.growth}
                </div>
              )}
              {card.subtext && (
                <div className="mt-0.5 text-xs text-fcn-text-light/40 dark:text-fcn-text-dark/40">{card.subtext}</div>
              )}
            </div>
          </Card>
        </StaggerItem>
      ))}
      </div>
    </StaggerChildren>
  );
};
