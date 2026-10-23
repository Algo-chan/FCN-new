import { useEffect } from "react";
import type { Article } from "@/types";

interface ArticleJsonLdProps {
  article: Article;
}

export const ArticleJsonLd = ({ article }: ArticleJsonLdProps) => {
  useEffect(() => {
    const authorName = article.author?.user?.full_name
      ? `Dr. ${article.author.user.full_name.replace(/^Dr\.?\s*/i, "")}`
      : "Fast Care Now Medical Contributor";

    const schemaData = {
      "@context": "https://schema.org",
      "@type": "MedicalWebPage",
      headline: article.title,
      description: article.excerpt,
      image:
        article.cover_image_url ||
        "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1200&q=80",
      datePublished: article.published_at || article.created_at,
      dateModified: article.updated_at,
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `${window.location.origin}/articles/${article.slug}`
      },
      author: {
        "@type": "Physician",
        name: authorName,
        medicalSpecialty: article.author?.specialty || article.category,
        worksFor: {
          "@type": "MedicalOrganization",
          name: article.author?.hospital?.name || "Fast Care Now Health Network",
          location: article.author?.hospital?.location || "Ethiopia"
        }
      },
      publisher: {
        "@type": "Organization",
        name: "Fast Care Now Ethiopia",
        url: window.location.origin,
        logo: {
          "@type": "ImageObject",
          url: `${window.location.origin}/logo.png`
        }
      },
      about: {
        "@type": "MedicalCondition",
        name: article.category
      }
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = `article-jsonld-${article.id}`;
    script.text = JSON.stringify(schemaData);
    document.head.appendChild(script);

    return () => {
      const existing = document.getElementById(`article-jsonld-${article.id}`);
      if (existing) {
        document.head.removeChild(existing);
      }
    };
  }, [article]);

  return null;
};
