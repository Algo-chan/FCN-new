import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { Clock, Search, MapPin, CheckCircle2 } from "lucide-react";
import { getVisitHistory } from "@/services/nurse-dashboard.service";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";

interface VisitHistoryItem {
  id: string;
  patient_id: string;
  patient_name: string;
  scheduled_at: string;
  status: string;
  appointment_type: string;
}

const NurseHistoryPage = () => {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["nurse-visit-history"],
    queryFn: () => getVisitHistory(),
  });

  const visits: VisitHistoryItem[] = (data as any)?.data ?? [];

  const filtered = visits.filter((v) =>
    v.patient_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">Visit History</h1>
        <p className="text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
          {visits.length} completed visit{visits.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fcn-text-light/30" />
        <input
          type="text"
          placeholder="Search by patient name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-fcn-primary/10 bg-white/80 py-2.5 pl-9 pr-3 text-sm text-fcn-text-light placeholder:text-fcn-text-light/30 focus:border-fcn-primary focus:outline-none focus:ring-1 focus:ring-fcn-primary dark:bg-fcn-dark/70 dark:text-fcn-text-dark dark:placeholder:text-fcn-text-dark/30 sm:w-80"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <Clock className="h-12 w-12 text-fcn-text-light/20 dark:text-fcn-text-dark/20 mb-4" />
          <p className="text-lg font-semibold text-fcn-text-light dark:text-fcn-text-dark">No visit history</p>
          <p className="text-sm text-fcn-text-light/50 dark:text-fcn-text-dark/50">
            {search ? "Try a different search term" : "Completed visits will appear here"}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((visit, idx) => (
            <motion.div
              key={visit.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
            >
              <div className="flex items-center gap-4 rounded-lg border border-fcn-primary/5 bg-white/50 px-4 py-3 dark:bg-fcn-dark/50 hover:bg-fcn-primary/5 transition-colors">
                <Avatar name={visit.patient_name} role="patient" size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-fcn-text-light dark:text-fcn-text-dark truncate">{visit.patient_name}</p>
                  <div className="flex items-center gap-3 text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(parseISO(visit.scheduled_at), "MMM d, yyyy 'at' h:mm a")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={visit.appointment_type === "nurse_visit" ? "info" : "success"} size="sm">
                    {visit.appointment_type.replace("_", " ")}
                  </Badge>
                  <Badge variant="success" size="sm">
                    <CheckCircle2 className="h-3 w-3" />
                    {visit.status}
                  </Badge>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NurseHistoryPage;
