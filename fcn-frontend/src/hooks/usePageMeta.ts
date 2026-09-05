import { useEffect } from "react";

interface PageMeta {
  title?: string;
  description?: string;
  canonical?: string;
}

export function usePageMeta(meta: PageMeta) {
  useEffect(() => {
    const { title, description, canonical } = meta;

    if (title) {
      document.title = title;
    }

    if (description) {
      const setOrCreate = (selector: string) => {
        let el = document.querySelector(selector);
        if (!el) {
          el = document.createElement("meta");
          document.head.appendChild(el);
        }
        return el as HTMLMetaElement;
      };
      setOrCreate('meta[name="description"]').setAttribute("content", description);
      setOrCreate('meta[property="og:description"]').setAttribute("content", description);
    }

    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      link.setAttribute("href", canonical);
    }
  }, [meta.title, meta.description, meta.canonical]);
}
