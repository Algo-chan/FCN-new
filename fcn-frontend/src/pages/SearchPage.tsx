import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Stethoscope, Building2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useDebounce } from "@/hooks/useDebounce";
import { Card } from "@/components/ui/Card";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

const apiBase = (import.meta.env.VITE_API_URL ?? "http://localhost:5000/api/v1").replace(/\/api\/v1\/?$/, "");
const searchEndpoint = `${apiBase}/search`;

interface SearchResult {
  hospitals: { id: string; name: string; location: string }[];
  doctors: {
    id: string;
    full_name: string;
    doctor_profile: {
      specialty: string;
      hospital: { name: string } | null;
    } | null;
  }[];
  specialties: string[];
}

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [input, setInput] = useState(searchParams.get("q") || "");
  const debounced = useDebounce(input, 300);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["search", debounced],
    queryFn: async () => {
      if (!debounced.trim()) return null;
      const res = await fetch(`${searchEndpoint}?q=${encodeURIComponent(debounced.trim())}`);
      if (!res.ok) throw new Error("Search failed");
      return (await res.json()) as { data: { query: string; results: SearchResult } };
    },
    enabled: debounced.trim().length > 0,
  });

  useEffect(() => {
    if (debounced.trim()) {
      setSearchParams({ q: debounced.trim() }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [debounced, setSearchParams]);

  const results = data?.data?.results as SearchResult | undefined;
  const totalCount = results
    ? results.hospitals.length + results.doctors.length + results.specialties.length
    : 0;

  return (
    <div className="min-h-screen bg-fcn-light text-fcn-text-light dark:bg-fcn-dark dark:text-fcn-text-dark">
      <Navbar />
      <div className="mx-auto w-full max-w-7xl px-4 pt-20 sm:px-6 lg:px-8">
        <Breadcrumbs />
        <div className="mx-auto max-w-4xl space-y-4 py-6 md:space-y-6">
          <div>
        <h1 className="text-xl md:text-2xl font-bold text-fcn-text-light dark:text-fcn-text-dark">Search</h1>
        <p className="mt-1 text-xs md:text-sm text-fcn-text-light/60 dark:text-fcn-text-dark/60">
          Find doctors, hospitals, and specialties across Fast Care Now
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-fcn-primary" />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search doctors, hospitals, specialties..."
          className="h-12 w-full rounded-lg border border-fcn-primary/20 bg-white pl-10 pr-4 text-sm text-fcn-text-light outline-none focus:border-fcn-accent focus:ring-2 focus:ring-fcn-accent/30 dark:bg-fcn-dark dark:text-fcn-text-dark"
          aria-label="Search Fast Care Now"
        />
      </div>

      {debounced.trim() && (
        <div className="text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">
          {isLoading ? "Searching..." : isError ? "Search failed. Please try again." : `${totalCount} result${totalCount === 1 ? "" : "s"} for "${debounced.trim()}"`}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-fcn-primary" />
        </div>
      )}

      {isError && <div className="text-center py-8 text-sm text-fcn-danger">Search failed. Please try again.</div>}

      {results && totalCount === 0 && (
        <Card className="p-8 text-center text-sm text-fcn-text-light/50 dark:text-fcn-text-dark/50">
          No results found for "{debounced.trim()}".
        </Card>
      )}

      {results && results.hospitals.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-fcn-text-light dark:text-fcn-text-dark">
            <Building2 className="h-4 w-4 text-fcn-primary" /> Hospitals ({results.hospitals.length})
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {results.hospitals.map((h) => (
              <Card key={h.id} className="p-4">
                <h3 className="text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark">{h.name}</h3>
                <p className="mt-1 text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">{h.location}</p>
              </Card>
            ))}
          </div>
        </section>
      )}

      {results && results.doctors.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-fcn-text-light dark:text-fcn-text-dark">
            <Stethoscope className="h-4 w-4 text-fcn-primary" /> Doctors ({results.doctors.length})
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {results.doctors.map((d) => (
              <Link key={d.id} to={`/doctors/${d.id}`}>
                <Card className="p-4 transition hover:border-fcn-primary/40">
                  <h3 className="text-sm font-semibold text-fcn-text-light dark:text-fcn-text-dark">Dr. {d.full_name}</h3>
                  <p className="mt-1 text-xs text-fcn-text-light/60 dark:text-fcn-text-dark/60">
                    {d.doctor_profile?.specialty}
                    {d.doctor_profile?.hospital?.name ? ` — ${d.doctor_profile.hospital.name}` : ""}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {results && results.specialties.length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-semibold text-fcn-text-light dark:text-fcn-text-dark">Specialties ({results.specialties.length})</h2>
          <div className="flex flex-wrap gap-2">
            {results.specialties.map((s) => (
              <span key={s} className="rounded-full border border-fcn-primary/20 px-3 py-1 text-xs font-medium text-fcn-primary">
                {s}
              </span>
            ))}
          </div>
        </section>
      )}

      {!debounced.trim() && !isLoading && (
        <Card className="p-8 text-center text-sm text-fcn-text-light/50 dark:text-fcn-text-dark/50">
          <Search className="mx-auto mb-3 h-8 w-8 text-fcn-primary/40" />
          Enter a search term to find doctors, hospitals, or specialties.
        </Card>
      )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SearchPage;
