import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { Pill, Search, ShoppingBag } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { FadeIn } from "@/components/animations/FadeIn";
import { StaggerChildren, StaggerItem } from "@/components/animations/StaggerChildren";
import { PrescriptionCard } from "@/components/pharmacy/PrescriptionCard";
import { PharmacyCard } from "@/components/pharmacy/PharmacyCard";
import { pharmacyService } from "@/services/pharmacy.service";
import type { PrescriptionWithMedications, Pharmacy } from "@/types";

type Tab = "prescriptions" | "pharmacies";
type StatusFilter = "all" | "active" | "refill_due" | "expired" | "dispensed";

const statusFilters: StatusFilter[] = ["all", "active", "refill_due", "expired", "dispensed"];

const PharmacyPage = () => {
  const shouldReduceMotion = useReducedMotion();
  const [tab, setTab] = useState<Tab>("prescriptions");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const prescriptionsQuery = useQuery({
    queryKey: ["my-prescriptions"],
    queryFn: () => pharmacyService.getMyPrescriptions(),
    staleTime: 2 * 60 * 1000
  });

  const pharmaciesQuery = useQuery({
    queryKey: ["pharmacies"],
    queryFn: () => pharmacyService.getPharmacies(),
    staleTime: 10 * 60 * 1000
  });

  const prescriptions = prescriptionsQuery.data?.data ?? [];
  const pharmacies = pharmaciesQuery.data?.data ?? [];

  const filteredPrescriptions = prescriptions.filter((p) => {
    if (statusFilter === "all") return true;
    return p.status === statusFilter;
  });

  const filteredPharmacies = pharmacies.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.location.toLowerCase().includes(q);
  });

  const counts = {
    all: prescriptions.length,
    active: prescriptions.filter((p) => p.status === "active").length,
    refill_due: prescriptions.filter((p) => p.status === "refill_due").length,
    expired: prescriptions.filter((p) => p.status === "expired").length,
    dispensed: prescriptions.filter((p) => p.status === "dispensed").length
  };

  return (
    <FadeIn>
      <div className="space-y-4 md:space-y-6">
        <motion.div
          className="flex items-center gap-3"
          initial={shouldReduceMotion ? false : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div
            animate={shouldReduceMotion ? {} : { y: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          >
            <Pill className="h-6 w-6 md:h-8 md:w-8 text-fcn-primary" />
          </motion.div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
              Pharmacy & Prescriptions
            </h1>
            <p className="text-xs md:text-sm text-fcn-text-light/50 dark:text-fcn-text-dark/50">
              Manage your medications and find partner pharmacies
            </p>
          </div>
        </motion.div>

        <div className="flex gap-1 rounded-lg border border-fcn-primary/20 p-1">
          {[
            { id: "prescriptions" as Tab, label: "My Prescriptions", icon: Pill },
            { id: "pharmacies" as Tab, label: "Partner Pharmacies", icon: ShoppingBag }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex flex-1 items-center justify-center gap-1 md:gap-2 rounded-md px-2 md:px-4 py-2 md:py-2.5 text-xs md:text-sm font-medium transition-colors ${
                tab === t.id
                  ? "text-white"
                  : "text-fcn-text-light/60 hover:text-fcn-primary dark:text-fcn-text-dark/60"
              }`}
            >
              {tab === t.id && (
                <motion.div
                  layoutId="pharmacy-tab-indicator"
                  className="absolute inset-0 rounded-md bg-fcn-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <t.icon className="relative z-10 h-4 w-4" />
              <span className="relative z-10">{t.label}</span>
            </button>
          ))}
        </div>

        {tab === "prescriptions" ? (
          <div className="space-y-4">
            <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-1">
              {statusFilters.map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    statusFilter === f
                      ? "bg-fcn-primary text-white"
                      : "bg-fcn-primary/10 text-fcn-primary hover:bg-fcn-primary/20"
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1).replace("_", " ")}
                  <span className="ml-1 opacity-60">({counts[f]})</span>
                </button>
              ))}
            </div>

            {prescriptionsQuery.isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-4 w-1/3 rounded bg-fcn-primary/10" />
                    <div className="mt-3 h-3 w-2/3 rounded bg-fcn-primary/5" />
                    <div className="mt-4 space-y-2">
                      <div className="h-12 rounded bg-fcn-primary/5" />
                      <div className="h-12 rounded bg-fcn-primary/5" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : filteredPrescriptions.length === 0 ? (
              <Card className="p-6 md:p-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full bg-fcn-primary/10">
                  <svg viewBox="0 0 48 48" fill="none" className="h-8 w-8 md:h-10 md:w-10 text-fcn-primary/40">
                    <rect x="19" y="6" width="10" height="36" rx="3" stroke="currentColor" strokeWidth="2" />
                    <rect x="6" y="19" width="36" height="10" rx="3" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </div>
                <h3 className="text-base md:text-lg font-medium text-fcn-text-light dark:text-fcn-text-dark">
                  No prescriptions yet
                </h3>
                <p className="mt-1 text-xs md:text-sm text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                  Your doctor will issue prescriptions during your consultations
                </p>
                <Button className="mt-4" onClick={() => window.location.href = "/appointments/book"}>
                  Book a Consultation
                </Button>
              </Card>
            ) : (
              <StaggerChildren>
                <div className="space-y-4">
                  {filteredPrescriptions.map((p) => (
                    <StaggerItem key={p.id}>
                      <PrescriptionCard prescription={p} />
                    </StaggerItem>
                  ))}
                </div>
              </StaggerChildren>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fcn-text-light/40 dark:text-fcn-text-dark/40" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pharmacies by name or location..."
                className="w-full rounded-lg border border-fcn-primary/20 bg-transparent py-2.5 pl-10 pr-4 text-sm focus:border-fcn-accent focus:outline-none"
              />
            </div>

            {pharmaciesQuery.isLoading ? (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                {[1, 2].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-5 w-2/3 rounded bg-fcn-primary/10" />
                    <div className="mt-3 space-y-2">
                      <div className="h-3 w-full rounded bg-fcn-primary/5" />
                      <div className="h-3 w-3/4 rounded bg-fcn-primary/5" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : filteredPharmacies.length === 0 ? (
              <Card className="p-6 md:p-8 text-center">
                <ShoppingBag className="mx-auto mb-3 h-10 w-10 md:h-12 md:w-12 text-fcn-primary/30" />
                <h3 className="text-base md:text-lg font-medium">No partner pharmacies yet</h3>
              </Card>
            ) : (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                {filteredPharmacies.map((pharmacy) => (
                  <PharmacyCard key={pharmacy.id} pharmacy={pharmacy} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </FadeIn>
  );
};

export default PharmacyPage;
