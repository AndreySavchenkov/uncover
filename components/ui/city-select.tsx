import * as React from "react";
import { supabase } from "@/lib/supabaseClient";
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

type CityRow = { id: string; name: string; country: string };
type Option = { value: string; label: string };

function useDebounced<T>(value: T, delay = 250) {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

interface CitySelectProps {
  value: string | null;
  onChange: (id: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  buttonClassName?: string;
  contentClassName?: string;
  countryCode?: string | null;
}

export function CitySelect({
  value,
  onChange,
  placeholder = "City, Country",
  disabled,
  buttonClassName,
  contentClassName,
  countryCode,
}: CitySelectProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const q = useDebounced(query, 250);
  const [options, setOptions] = React.useState<Option[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [label, setLabel] = React.useState<string | null>(null);

  // подтягиваем метку выбранного города
  React.useEffect(() => {
    let ignore = false;
    (async () => {
      if (!value) {
        if (!ignore) setLabel(null);
        return;
      }
      const { data } = await supabase
        .from("cities")
        .select("id,name,country")
        .eq("id", value)
        .maybeSingle();
      if (!ignore) setLabel(data ? `${data.name}, ${data.country}` : null);
    })();
    return () => {
      ignore = true;
    };
  }, [value]);

  // поиск (только при >= 2 символов)
  React.useEffect(() => {
    let ignore = false;
    (async () => {
      if (q.trim().length < 2) {
        if (!ignore) setOptions([]);
        return;
      }
      setLoading(true);
      let queryBuilder = supabase
        .from("cities")
        .select("id,name,country")
        .ilike("name", `%${q}%`)
        .limit(20);

      if (countryCode)
        queryBuilder = queryBuilder.eq("country_code", countryCode);

      const { data, error } = await queryBuilder;
      if (!ignore) {
        setOptions(
          !error && data
            ? data.map((c: CityRow) => ({
                value: c.id,
                label: `${c.name}, ${c.country}`,
              }))
            : []
        );
        setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [q, countryCode]);

  const clear = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onChange(null);
    setLabel(null);
  };

  return (
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
            !label && "text-muted-foreground",
            buttonClassName
          )}
        >
          <span className="truncate">{label || placeholder}</span>
          <span className="flex items-center gap-1">
            {value && (
              <span
                role="button"
                aria-label="Clear"
                onClick={clear}
                className="rounded p-1 hover:bg-muted"
              >
                <X className="h-4 w-4 opacity-70" />
              </span>
            )}
            <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
          </span>
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
          <CommandInput
            placeholder="Type at least 2 letters…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandEmpty>{loading ? "Loading…" : "Nothing found."}</CommandEmpty>
          <CommandGroup className="max-h-72 overflow-auto">
            {options.map((opt) => (
              <CommandItem
                key={opt.value}
                value={opt.label} // важно: фильтрация идёт по этому значению
                onSelect={() => {
                  onChange(opt.value); // сохраняем id
                  setLabel(opt.label); // показываем "City, Country"
                  setOpen(false);
                }}
                className="cursor-pointer"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === opt.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {opt.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
