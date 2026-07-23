import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { Users, Search, Phone, MapPin, Clock, Activity, Heart } from "lucide-react";
import { clsx } from "clsx";
import { healthRecordsService } from "@/services/health-records.service";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Avatar } from "@/components/ui/Avatar";

const NursePatientsPage = () => {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["nurse-patients"],
    queryFn: () => healthRecordsService.getNursePatients(),
  });

  const patients = (data as any)?.data ?? [];

  const filtered = patients.filter((p: any) =>
    p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.phone?.includes(search)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">My Patients</h1>
        <p className="text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
          {patients.length} patient{patients.length !== 1 ? "s" : ""} assigned
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fcn-text-light/30" />
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-fcn-primary/10 bg-white/80 py-2.5 pl-9 pr-3 text-sm text-fcn-text-light placeholder:text-fcn-text-light/30 focus:border-fcn-primary focus:outline-none focus:ring-1 focus:ring-fcn-primary dark:bg-fcn-dark/70 dark:text-fcn-text-dark dark:placeholder:text-fcn-text-dark/30 sm:w-80"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="h-12 w-12 text-fcn-text-light/20 dark:text-fcn-text-dark/20 mb-4" />
          <p className="text-lg font-semibold text-fcn-text-light dark:text-fcn-text-dark">No patients found</p>
          <p className="text-sm text-fcn-text-light/50 dark:text-fcn-text-dark/50">
            {search ? "Try a different search term" : "Patients will appear after your first visit"}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((patient: any, idx: number) => (
            <motion.div
              key={patient.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card hoverable className="space-y-3">
                <div className="flex items-start gap-3">
                  <Avatar name={patient.full_name} role="patient" size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-fcn-text-light dark:text-fcn-text-dark truncate">{patient.full_name}</p>
                    {patient.phone && (
                      <p className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50 flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {patient.phone}
                      </p>
                    )}
                  </div>
                </div>

                {patient.home_address && (
                  <p className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50 flex items-center gap-1.5 truncate">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {patient.home_address}
                  </p>
                )}

                {patient.latest_vitals && (
                  <div className="grid grid-cols-2 gap-2 rounded-lg bg-fcn-primary/5 p-2.5">
                    {patient.latest_vitals.bp_systolic != null && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <Heart className="h-3 w-3 text-fcn-danger" />
                        <span className="text-fcn-text-light/50 dark:text-fcn-text-dark/50">BP</span>
                        <span className="font-medium text-fcn-text-light dark:text-fcn-text-dark">
                          {patient.latest_vitals.bp_systolic}/{patient.latest_vitals.bp_diastolic}
                        </span>
                      </div>
                    )}
                    {patient.latest_vitals.heart_rate_bpm != null && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <Activity className="h-3 w-3 text-fcn-accent" />
                        <span className="text-fcn-text-light/50 dark:text-fcn-text-dark/50">HR</span>
                        <span className="font-medium text-fcn-text-light dark:text-fcn-text-dark">
                          {patient.latest_vitals.heart_rate_bpm} bpm
                        </span>
                      </div>
                    )}
                    {patient.latest_vitals.spo2_percent != null && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-fcn-text-light/50 dark:text-fcn-text-dark/50">SpO2</span>
                        <span className="font-medium text-fcn-text-light dark:text-fcn-text-dark">
                          {patient.latest_vitals.spo2_percent}%
                        </span>
                      </div>
                    )}
                    {patient.latest_vitals.temperature_celsius != null && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-fcn-text-light/50 dark:text-fcn-text-dark/50">Temp</span>
                        <span className="font-medium text-fcn-text-light dark:text-fcn-text-dark">
                          {patient.latest_vitals.temperature_celsius}°C
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {patient.total_visits} visit{patient.total_visits !== 1 ? "s" : ""}
                  </span>
                  {patient.next_visit && (
                    <span>Next: {format(parseISO(patient.next_visit), "MMM d")}</span>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NursePatientsPage;
