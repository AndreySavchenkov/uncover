import { useId, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { ImagePlus } from "lucide-react";

type PhotoUploaderProps = {
  id?: string;
  label?: string;
  hint?: string;
  accept?: string;
  disabled?: boolean;
  previewUrl?: string | null;
  onSelectFile: (file: File | null) => void;
  className?: string;
};

export function PhotoUploader({
  id,
  label = "Profile photo",
  hint = "PNG/JPG up to 5MB",
  accept = "image/*",
  disabled,
  previewUrl,
  onSelectFile,
  className,
}: PhotoUploaderProps) {
  const autoId = useId();
  const inputId = id ?? `photo-input-${autoId}`;
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleChange = (f?: File) => onSelectFile(f ?? null);

  return (
    <Field className={className}>
      <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        className="hidden"
        disabled={disabled}
        onChange={(e) => handleChange(e.target.files?.[0])}
      />
      <label
        htmlFor={inputId}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) handleChange(f);
        }}
        className="relative mt-2 block aspect-square w-full overflow-hidden rounded-xl border-2 border-dashed border-muted-foreground/40 bg-muted/40 hover:bg-muted/60 transition-colors cursor-pointer"
        aria-describedby={`${inputId}-hint`}
      >
        {previewUrl ? (
          <>
            <Image
              src={previewUrl}
              alt="Photo preview"
              fill
              unoptimized
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 320px"
            />
            <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute bottom-2 right-2 rounded-md bg-background/80 px-2 py-1 text-xs text-foreground shadow-sm backdrop-blur">
              Change photo
            </div>
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <ImagePlus className="h-8 w-8 opacity-70" />
            <div className="text-sm font-medium">Click or drop image</div>
            <div id={`${inputId}-hint`} className="text-xs">
              {hint}
            </div>
          </div>
        )}
      </label>

      {previewUrl && (
        <div className="mt-2 flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            className="h-8"
          >
            Change
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => handleChange(undefined)}
            className="h-8 text-destructive hover:text-destructive"
          >
            Remove
          </Button>
        </div>
      )}
    </Field>
  );
}