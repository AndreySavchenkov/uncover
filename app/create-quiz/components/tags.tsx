import { Tag } from "@/components/ui/tag";
import { getTagEmoji } from "@/helpers/getTagEmoji";
import { CORE_TAG_ORDER, CoreTag } from "@/types";

type TagsProps = {
  tagsError: string | null;
  tagsLoading: boolean;
  tags: string[];
  tagCounts: Record<string, number>;
  handleTagClick: (tag: string) => void;
};

function getTagScheme(tag: string): CoreTag | "default" {
  const key = tag.trim().toLowerCase();
  return (CORE_TAG_ORDER as readonly string[]).includes(key)
    ? (key as CoreTag)
    : "default";
}

export const Tags = ({ tagsError, tagsLoading, tags, tagCounts, handleTagClick }: TagsProps) => {
  return (
    <>
      {tagsError && (
        <div className="mb-4 text-sm text-red-500">{tagsError}</div>
      )}
      {tagsLoading ? (
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="h-11 w-36 bg-muted rounded-full animate-pulse"
            />
          ))}
        </div>
      ) : tags.length === 0 ? (
        <div className="text-muted-foreground">No tags found</div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {tags.map((t) => (
            <Tag
              key={t}
              scheme={getTagScheme(t)}
              onClick={() => handleTagClick(t)}
              title={t}
              aria-label={`Tag ${t}`}
            >
              <span className="mr-2 text-lg">{getTagEmoji(t)}</span>
              <span>{t}</span>
              <span className="ml-2 text-[11px] rounded-full px-2 py-0.5 bg-black/10 dark:bg-white/10">
                {tagCounts[t] ?? 0}
              </span>
            </Tag>
          ))}
        </div>
      )}
    </>
  );
};
