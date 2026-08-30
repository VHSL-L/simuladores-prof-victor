import { useEffect } from "react";

type PageMetadataProps = {
  title: string;
  description: string;
};

export function PageMetadata({ title, description }: PageMetadataProps) {
  useEffect(() => {
    document.title = `${title} | Simuladores do Prof. Victor Hugo Sant'Ana`;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", description);
    document
      .querySelector('meta[property="og:title"]')
      ?.setAttribute("content", title);
    document
      .querySelector('meta[property="og:description"]')
      ?.setAttribute("content", description);
  }, [title, description]);

  return null;
}
