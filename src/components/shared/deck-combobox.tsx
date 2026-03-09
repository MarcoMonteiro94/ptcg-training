"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getArchetypeImageUrl } from "@/lib/pokemon-images";

interface DeckComboboxProps {
  archetypes: Array<{ id: string; name: string }>;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
  myDecks?: Array<{ id: string; name: string }>;
  className?: string;
}

export function DeckCombobox({
  archetypes,
  value,
  onValueChange,
  placeholder = "Select deck",
  allowEmpty = false,
  emptyLabel = "All Decks",
  myDecks,
  className,
}: DeckComboboxProps) {
  const [open, setOpen] = useState(false);

  const selectedName =
    value === ""
      ? allowEmpty
        ? emptyLabel
        : ""
      : archetypes.find((a) => a.id === value)?.name ||
        myDecks?.find((d) => d.id === value)?.name ||
        "";

  const selectedImg = value ? getArchetypeImageUrl(value) : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "justify-between bg-muted/20 border-border/50 h-9 font-normal text-sm",
            !value && !allowEmpty && "text-muted-foreground",
            className
          )}
        >
          <span className="flex items-center gap-2 truncate">
            {selectedImg && (
              <Image
                src={selectedImg}
                alt=""
                width={18}
                height={18}
                className="h-[18px] w-[18px] object-contain shrink-0"
                unoptimized
              />
            )}
            <span className="truncate">
              {selectedName || placeholder}
            </span>
          </span>
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search decks..." className="h-9" />
          <CommandList>
            <CommandEmpty>No deck found.</CommandEmpty>
            {allowEmpty && (
              <CommandGroup>
                <CommandItem
                  value={emptyLabel}
                  onSelect={() => {
                    onValueChange("");
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-3.5 w-3.5",
                      value === "" ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {emptyLabel}
                </CommandItem>
              </CommandGroup>
            )}
            {myDecks && myDecks.length > 0 && (
              <CommandGroup heading="My Decks">
                {myDecks.map((deck) => {
                  const img = getArchetypeImageUrl(deck.id);
                  return (
                    <CommandItem
                      key={`my-${deck.id}`}
                      value={`my-deck-${deck.name}`}
                      onSelect={() => {
                        onValueChange(deck.id);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-3.5 w-3.5",
                          value === deck.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {img && (
                        <Image
                          src={img}
                          alt=""
                          width={18}
                          height={18}
                          className="mr-1.5 h-[18px] w-[18px] object-contain"
                          unoptimized
                        />
                      )}
                      {deck.name}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
            <CommandGroup heading={myDecks && myDecks.length > 0 ? "All Archetypes" : undefined}>
              {archetypes.map((arch) => {
                const img = getArchetypeImageUrl(arch.id);
                return (
                  <CommandItem
                    key={arch.id}
                    value={arch.name}
                    onSelect={() => {
                      onValueChange(arch.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-3.5 w-3.5",
                        value === arch.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {img && (
                      <Image
                        src={img}
                        alt=""
                        width={18}
                        height={18}
                        className="mr-1.5 h-[18px] w-[18px] object-contain"
                        unoptimized
                      />
                    )}
                    {arch.name}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
