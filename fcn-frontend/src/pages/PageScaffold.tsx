import { PageTransition } from "@/components/animations/PageTransition";
import { PageHeader } from "@/components/ui/PageHeader";
import { Sparkles, Construction } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface PageScaffoldProps {
  title: string;
  section?: string;
}

export const PageScaffold = ({ title, section = "Module" }: PageScaffoldProps) => (
  <PageTransition>
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={`The ${section} workspace is actively undergoing clinical integration and test verification.`}
        icon={Construction}
        iconVariant="indigo"
        eyebrow="Workspace Preview"
      />
      <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 mb-4">
          <Sparkles className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          {title} Interface
        </h3>
        <p className="mt-1 text-sm text-slate-500 max-w-md">
          This section is undergoing medical workflow testing and will be fully operational shortly.
        </p>
      </Card>
    </div>
  </PageTransition>
);
