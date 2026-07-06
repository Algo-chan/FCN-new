import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Search, Users, Calendar, Stethoscope } from "lucide-react";
import { getPreviousPatients, type PreviousPatient } from "@/services/doctor-dashboard.service";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

export const PreviousPatientsSection = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data: res, isLoading } = useQuery({
    queryKey: ["previous-patients", page],
    queryFn: () => getPreviousPatients(page),
  });

  const patients = res?.data ?? [];
  const meta = (res as any)?.meta ?? { total: 0, page, limit: 20 };
  const totalPages = Math.ceil(meta.total / meta.limit);

  const filtered = search.trim()
    ? patients.filter((p: PreviousPatient) => p.full_name.toLowerCase().includes(search.toLowerCase()))
    : patients;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark">Previous Patients</h3>
          <p className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">
            {meta.total} patients consulted
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-fcn-text-light/40 dark:text-fcn-text-dark/40" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name..."
          className="w-full rounded-lg border border-fcn-primary/10 bg-white py-2 pl-9 pr-3 text-xs text-fcn-text-light outline-none focus:border-fcn-primary dark:bg-fcn-dark dark:text-fcn-text-dark"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Spinner size="md" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <Users className="h-8 w-8 text-fcn-text-light/20 dark:text-fcn-text-dark/20 mb-2" />
          <p className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">No previous patients found</p>
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((p: PreviousPatient) => (
            <div key={p.patient_id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-fcn-primary/5 transition-colors">
              <Avatar name={p.full_name} role="patient" size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-fcn-text-light dark:text-fcn-text-dark truncate">
                  {p.full_name}
                </p>
                <div className="flex items-center gap-3 text-[10px] text-fcn-text-light/50 dark:text-fcn-text-dark/50 mt-0.5">
                  {p.age !== null && <span>{p.age}y</span>}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-2.5 w-2.5" />
                    {format(parseISO(p.last_consultation), "MMM d, yyyy")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Stethoscope className="h-2.5 w-2.5" />
                    {p.total_consultations} visit{p.total_consultations !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button size="sm" variant="ghost" onClick={() => window.location.href = `/appointments/book?doctor=${p.patient_id}`}>
                  Book Again
                </Button>
                <a href={`/health-records/${p.patient_id}`} className="text-[10px] text-fcn-primary hover:underline shrink-0">
                  View Records
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {page < totalPages && !search.trim() && (
        <div className="text-center pt-2">
          <Button variant="secondary" size="sm" onClick={() => setPage((p) => p + 1)}>
            Load More
          </Button>
        </div>
      )}
    </div>
  );
};
