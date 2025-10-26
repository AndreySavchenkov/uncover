import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type Option = { value: string; label: string };

type ValueType = string | string[] | null;

interface MultiSelectProps {
  options: Option[];
  value?: ValueType;
  onChange: (value: ValueType) => void;
  multiple?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
  clearable?: boolean;
  maxSelected?: number;
  buttonClassName?: string;
  contentClassName?: string;
  chipsMax?: number;
  // управление поиском
  enableSearch?: boolean; // полностью включить/выключить поиск
  searchThreshold?: number; // показывать поиск только если элементов >= threshold
}

export function MultiSelect({
  options,
  value = null,
  onChange,
  multiple = false,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyText = "Nothing found.",
  disabled,
  className,
  clearable = true,
  maxSelected,
  buttonClassName,
  contentClassName,
  chipsMax = 2,
  enableSearch = true,
  searchThreshold = 4, // при 3 элементах поиск не покажется
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const showSearch = enableSearch && options.length >= searchThreshold;

  const selectedValues = React.useMemo<string[]>(
    () => (Array.isArray(value) ? value : value ? [value] : []),
    [value]
  );

  const isSelected = React.useCallback(
    (v: string) => selectedValues.includes(v),
    [selectedValues]
  );

  const labelsMap = React.useMemo<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    for (const o of options) m[o.value] = o.label;
    return m;
  }, [options]);

  const visibleChips = selectedValues.slice(0, chipsMax);
  const hiddenCount = Math.max(0, selectedValues.length - visibleChips.length);

  const canAddMore = (next: string[]) =>
    typeof maxSelected === "number" ? next.length <= maxSelected : true;

  const commitChange = (next: string[]) => {
    if (multiple) onChange(next);
    else onChange(next[0] ?? null);
  };

  const toggleValue = (v: string) => {
    if (multiple) {
      const next = isSelected(v)
        ? selectedValues.filter((x) => x !== v)
        : [...selectedValues, v];
      if (!canAddMore(next)) return;
      commitChange(next);
    } else {
      commitChange(isSelected(v) ? [] : [v]);
      setOpen(false);
    }
  };

  const clear = () => {
    commitChange([]);
  };

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between",
              selectedValues.length === 0 && "text-muted-foreground",
              buttonClassName
            )}
          >
            <div className="flex flex-1 flex-wrap items-center gap-1 truncate text-left">
              {selectedValues.length === 0 && (
                <span className="truncate">{placeholder}</span>
              )}
              {!multiple && selectedValues.length === 1 && (
                <span className="truncate">{labelsMap[selectedValues[0]]}</span>
              )}
              {multiple && selectedValues.length > 0 && (
                <>
                  {visibleChips.map((v) => (
                    <span
                      key={v}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleValue(v);
                      }}
                      className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs"
                    >
                      {labelsMap[v]}
                      <X className="h-3.5 w-3.5 opacity-60" />
                    </span>
                  ))}
                  {hiddenCount > 0 && (
                    <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs">
                      +{hiddenCount}
                    </span>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center gap-1 pl-2">
              {clearable && selectedValues.length > 0 && (
                <span
                  role="button"
                  aria-label="Clear"
                  onClick={(e) => {
                    e.stopPropagation();
                    clear();
                  }}
                  className="rounded p-1 hover:bg-muted"
                >
                  <X className="h-4 w-4 opacity-70" />
                </span>
              )}
              <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className={cn(
            "w-[--radix-popover-trigger-width] p-0",
            contentClassName
          )}
          align="start"
        >
          <Command>
            {showSearch && <CommandInput placeholder={searchPlaceholder} />}
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {options.map((opt) => {
                const selected = isSelected(opt.value);
                return (
                  <CommandItem
                    key={opt.value}
                    value={opt.value}
                    onSelect={() => toggleValue(opt.value)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {opt.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
