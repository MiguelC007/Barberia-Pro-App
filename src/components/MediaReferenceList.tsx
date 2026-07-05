import { Paperclip } from "lucide-react";
import type { MediaReference } from "../types";

export function MediaReferenceList({
  items,
  title = "Adjuntos"
}: {
  items: MediaReference[];
  title?: string;
}) {
  if (!items.length) return null;

  return (
    <div className="media-list">
      <strong>{title}</strong>
      <div className="media-grid">
        {items.map((item) => (
          <article className="media-chip" key={item.id}>
            {item.type === "image" ? (
              <img src={item.url} alt={item.name} />
            ) : item.type === "video" ? (
              <video src={item.url} controls />
            ) : (
              <div className="media-file">
                <Paperclip size={16} />
                <span>{item.name}</span>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
