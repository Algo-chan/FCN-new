import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Pill, Search, ShoppingBag, Plus, Sparkles, Building, MapPin } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { FadeIn } from "@/components/animations/FadeIn";
import { StaggerChildren, StaggerItem } from "@/components/animations/StaggerChildren";
import { PrescriptionCard } from "@/components/pharmacy/PrescriptionCard";
import { PharmacyCard } from "@/components/pharmacy/PharmacyCard";
import { pharmacyService } from "@/services/pharmacy.service";
import { useNavigate } from "react-router-dom";
import type { PrescriptionWithMedications, Pharmacy } from "@/types";

type Tab = "prescriptions" | "pharmacies";
type StatusFilter = "all" | "active" | "refill_due" | "expired" | "dispensed";

const statusFilters: StatusFilter[] = ["all", "active", "refill_due", "expired", "dispensed"];

const PharmacyPage = () => {
  const navigate = useNavigate();
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
      <div className="mx-auto max-w-6xl space-y-6 pb-20 md:pb-8">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/20">
              <Pill className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">
                  Pharmacy & Prescriptions
                </h1>
                <Badge variant="info" size="sm">E-Prescription</Badge>
              </div>
              <p className="text-xs sm:text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                Manage medications, track refills, and find partner pharmacies
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate("/appointments/book")}
            className="h-10 text-xs sm:text-sm self-start sm:self-auto"
          >
            <Sparkles className="h-4 w-4 mr-1.5" />
            Request Doctor Consult
          </Button>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-fcn-surface-light dark:bg-fcn-surface-dark border border-fcn-primary/10 p-1 max-w-md">
          {[
            { id: "prescriptions" as Tab, label: "My Prescriptions", count: prescriptions.length, icon: Pill },
            { id: "pharmacies" as Tab, label: "Partner Pharmacies", count: pharmacies.length, icon: ShoppingBag }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 px-3 text-xs sm:text-sm font-semibold transition-all ${
                tab === t.id
                  ? "text-white shadow-sm"
                  : "text-fcn-text-light/60 hover:text-fcn-text-light dark:text-fcn-text-dark/60"
              }`}
            >
              {tab === t.id && (
                <motion.div
                  layoutId="pharmacy-tab-pill"
                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-fcn-primary to-fcn-accent"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <t.icon className="relative z-10 h-4 w-4" />
              <span className="relative z-10">{t.label}</span>
              <span className={`relative z-10 rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                tab === t.id ? "bg-white/20 text-white" : "bg-fcn-primary/10 text-fcn-primary"
              }`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {tab === "prescriptions" ? (
          <div className="space-y-5">
            {/* Horizontal Filter Chips */}
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
              {statusFilters.map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all active:scale-95 border ${
                    statusFilter === f
                      ? "bg-fcn-primary text-white border-fcn-primary shadow-sm"
                      : "bg-white dark:bg-fcn-dark text-fcn-text-light/70 dark:text-fcn-text-dark/70 border-fcn-primary/10 hover:border-fcn-primary/30"
                  }`}
                >
                  {f === "all" ? "All Prescriptions" : f.charAt(0).toUpperCase() + f.slice(1).replace("_", " ")}
                  <span className={`ml-1.5 text-[11px] font-bold ${statusFilter === f ? "text-white/80" : "text-fcn-text-light/40"}`}>
                    ({counts[f]})
                  </span>
                </button>
              ))}
            </div>

            {prescriptionsQuery.isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse p-6 rounded-2xl">
                    <div className="h-5 w-1/3 rounded-lg bg-fcn-primary/10" />
                    <div className="mt-3 h-4 w-2/3 rounded-lg bg-fcn-primary/5" />
                    <div className="mt-4 space-y-2">
                      <div className="h-12 rounded-xl bg-fcn-primary/5" />
                      <div className="h-12 rounded-xl bg-fcn-primary/5" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : filteredPrescriptions.length === 0 ? (
              <Card className="p-8 sm:p-12 text-center max-w-md mx-auto space-y-4 rounded-2xl">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-fcn-primary/10 text-fcn-primary">
                  <Pill className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-fcn-text-light dark:text-fcn-text-dark">
                    No prescriptions found
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                    {statusFilter === "all"
                      ? "Your doctor will issue digital QR-verified prescriptions after your consultations."
                      : `No prescriptions match the "${statusFilter.replace("_", " ")}" filter.`}
                  </p>
                </div>
                <Button
                  className="mt-2"
                  variant="primary"
                  onClick={() => navigate("/appointments/book")}
                >
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
          <div className="space-y-5">
            {/* Search Input */}
            <div className="relative max-w-lg">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fcn-text-light/40 dark:text-fcn-text-dark/40" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pharmacies by name, city, or area..."
                className="w-full rounded-xl border border-fcn-primary/20 bg-white dark:bg-fcn-dark py-2.5 pl-10 pr-4 text-sm text-fcn-text-light placeholder:text-fcn-text-light/40 outline-none transition-all focus:border-fcn-primary focus:ring-2 focus:ring-fcn-primary/20 dark:text-fcn-text-dark"
              />
            </div>

            {pharmaciesQuery.isLoading ? (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="animate-pulse p-5 rounded-2xl">
                    <div className="h-5 w-2/3 rounded-lg bg-fcn-primary/10" />
                    <div className="mt-3 space-y-2">
                      <div className="h-4 w-full rounded-lg bg-fcn-primary/5" />
                      <div className="h-4 w-3/4 rounded-lg bg-fcn-primary/5" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : filteredPharmacies.length === 0 ? (
              <Card className="p-8 sm:p-12 text-center max-w-md mx-auto space-y-3 rounded-2xl">
                <ShoppingBag className="mx-auto h-12 w-12 text-fcn-primary/30" />
                <h3 className="text-base sm:text-lg font-bold text-fcn-text-light dark:text-fcn-text-dark">
                  No pharmacies match your search
                </h3>
                <p className="text-xs sm:text-sm text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                  Try searching for another neighborhood or city in Ethiopia.
                </p>
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
