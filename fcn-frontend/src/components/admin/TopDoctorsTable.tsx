import { useState, useMemo } from "react";
import { ArrowUpDown, Star } from "lucide-react";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import type { TopDoctor } from "@/services/admin.service";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";

interface Props {
  data: TopDoctor[];
  loading?: boolean;
}

type SortKey = "completed_consultations" | "rating_average" | "revenue_generated" | "full_name";

const rankDisplay = (i: number) => {
  if (i === 0) return "\uD83E\uDD47";
  if (i === 1) return "\uD83E\uDD48";
  if (i === 2) return "\uD83E\uDD49";
  return `#${i + 1}`;
};

export const TopDoctorsTable = ({ data, loading }: Props) => {
  const [sortKey, setSortKey] = useState<SortKey>("completed_consultations");
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<TopDoctor | null>(null);

  const sorted = useMemo(() => {
    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortAsc
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
  }, [data, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const SortHeader = ({ label, sortKey: sk }: { label: string; sortKey: SortKey }) => (
    <th
      className="cursor-pointer px-4 py-3 text-xs font-medium text-fcn-text-light/60 dark:text-fcn-text-dark/60"
      onClick={() => toggleSort(sk)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className="h-3 w-3" />
      </div>
    </th>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <Card>
        <h3 className="mb-4 text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark">
          Top Performing Doctors
        </h3>
        {loading ? (
          <div className="h-[200px] animate-pulse rounded-lg bg-fcn-primary/5" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-fcn-primary/10">
                  <th className="px-4 py-3 text-xs font-medium text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                    Rank
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                    Doctor
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                    Specialty
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                    Hospital
                  </th>
                  <SortHeader label="Consultations" sortKey="completed_consultations" />
                  <SortHeader label="Rating" sortKey="rating_average" />
                  <SortHeader label="Revenue" sortKey="revenue_generated" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((doc, i) => (
                  <tr
                    key={doc.doctor_id}
                    className="cursor-pointer border-b border-fcn-primary/5 transition-colors hover:bg-fcn-primary/[0.02]"
                    onClick={() => setSelectedDoctor(doc)}
                  >
                    <td className="px-4 py-3 text-lg">{rankDisplay(i)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar
                          imageUrl={doc.photo_url}
                          name={doc.full_name}
                          size="sm"
                          role="doctor"
                        />
                        <span className="font-medium text-fcn-text-light dark:text-fcn-text-dark">
                          {doc.full_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-fcn-text-light/70 dark:text-fcn-text-dark/70">
                      {doc.specialty}
                    </td>
                    <td className="px-4 py-3 text-fcn-text-light/70 dark:text-fcn-text-dark/70">
                      {doc.hospital_name || "\u2014"}
                    </td>
                    <td className="px-4 py-3 font-medium text-fcn-text-light dark:text-fcn-text-dark">
                      {doc.completed_consultations}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-fcn-accent text-fcn-accent" />
                        <span className="font-medium">
                          {doc.rating_average.toFixed(1)}
                        </span>
                        <span className="text-xs text-fcn-text-light/40">
                          ({doc.rating_count})
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-fcn-text-light dark:text-fcn-text-dark">
                      {doc.revenue_generated > 0 ? `Br ${doc.revenue_generated.toLocaleString()}` : "\u2014"}
                    </td>
                  </tr>
                ))}
                {sorted.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-fcn-text-light/40">
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selectedDoctor && (
        <Modal
          isOpen={!!selectedDoctor}
          onClose={() => setSelectedDoctor(null)}
          title="Doctor Profile"
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar
                imageUrl={selectedDoctor.photo_url}
                name={selectedDoctor.full_name}
                size="lg"
                role="doctor"
              />
              <div>
                <h3 className="text-lg font-bold text-fcn-text-light dark:text-fcn-text-dark">
                  {selectedDoctor.full_name}
                </h3>
                <p className="text-sm text-fcn-text-light/60">{selectedDoctor.specialty}</p>
                <p className="text-sm text-fcn-text-light/40">{selectedDoctor.hospital_name || "\u2014"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 rounded-lg bg-fcn-primary/5 p-4">
              <div>
                <p className="text-xs text-fcn-text-light/40">Total Consultations</p>
                <p className="text-lg font-bold">{selectedDoctor.total_consultations}</p>
              </div>
              <div>
                <p className="text-xs text-fcn-text-light/40">Completed</p>
                <p className="text-lg font-bold">{selectedDoctor.completed_consultations}</p>
              </div>
              <div>
                <p className="text-xs text-fcn-text-light/40">Rating</p>
                <p className="text-lg font-bold">
                  {selectedDoctor.rating_average.toFixed(1)} / 5.0
                  <span className="ml-1 text-xs text-fcn-text-light/40">({selectedDoctor.rating_count})</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-fcn-text-light/40">Revenue Generated</p>
                <p className="text-lg font-bold">
                  {selectedDoctor.revenue_generated > 0 ? `Br ${selectedDoctor.revenue_generated.toLocaleString()}` : "\u2014"}
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </motion.div>
  );
};
