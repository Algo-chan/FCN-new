import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { useEffect } from "react";

interface Crumb {
  name: string;
  path: string;
}

const ROUTE_MAP: Record<string, string> = {
  "dashboard": "Dashboard",
  "hospitals": "Hospitals",
  "notifications": "Notifications",
  "profile": "Profile",
  "doctors": "Find Doctors",
  "appointments": "Appointments",
  "consultation": "Consultation",
  "health-records": "Health Records",
  "ai-check": "AI Symptom Check",
  "pharmacy": "Pharmacy",
  "doctor": "Doctor",
  "nurse": "Nurse",
  "hospital-admin": "Hospital Admin",
  "pharmacy-admin": "Pharmacy Admin",
  "admin": "Admin",
  "search": "Search",
  "onboarding": "Onboarding",
  "pending": "Pending Approval",
  "login": "Login",
  "register": "Register"
};

function dumpJsonLd(crumbs: Crumb[]): void {
  const itemListElement = crumbs.map((c, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: c.name,
    item: `https://fcncare.com${c.path}`
  }));

  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement
  });
  document.head.appendChild(script);
  setTimeout(() => script.remove(), 5000);
}

export const Breadcrumbs = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);

  const buildCrumbs = (): Crumb[] => {
    const crumbs: Crumb[] = [{ name: "Home", path: "/" }];
    let currentPath = "";

    for (const seg of pathSegments) {
      currentPath += `/${seg}`;
      const name = ROUTE_MAP[seg] || seg.charAt(0).toUpperCase() + seg.slice(1);
      crumbs.push({ name, path: currentPath });
    }

    return crumbs;
  };

  const crumbs = buildCrumbs();

  useEffect(() => {
    dumpJsonLd(crumbs);
  }, [location.pathname]);

  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1 text-xs text-fcn-text-light/50 dark:text-fcn-text-dark/50">
        {crumbs.map((crumb, i) => (
          <li key={crumb.path} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3 w-3" />}
            {i === crumbs.length - 1 ? (
              <span className="font-medium text-fcn-text-light/70 dark:text-fcn-text-dark/70" aria-current="page">
                {crumb.name}
              </span>
            ) : (
              <Link to={crumb.path} className="transition hover:text-fcn-accent">
                {i === 0 ? <Home className="h-3 w-3" /> : crumb.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};
