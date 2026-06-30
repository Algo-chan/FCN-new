import { PageTransition } from "@/components/animations/PageTransition";

interface PageScaffoldProps {
  title: string;
  section?: string;
}

export const PageScaffold = ({ title, section = "Section X" }: PageScaffoldProps) => (
  <PageTransition>
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold text-fcn-text-light dark:text-fcn-text-dark">{title}</h1>
      <p className="text-fcn-text-light/70 dark:text-fcn-text-dark/70">Coming soon - {section}</p>
    </section>
  </PageTransition>
);
