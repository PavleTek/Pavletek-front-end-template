// This fucking shit is supposed to work with everything. Typescript is not encouraged here.
"use client";

import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions, Label } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { useState, useMemo } from "react";
import { useDrawer } from "../contexts/DrawerContext";

interface ReusableDropdownProps {
  items?: Array<{ id?: number | string; name: string; [key: string]: any }>;
  label?: string;
  value?: { id?: number | string; name: string; [key: string]: any } | null;
  onChange?: (item: { id?: number | string; name: string; [key: string]: any } | null) => void;
  drawerId?: string;
}

const NEW_OPTION_VALUE = { id: "__NEW__", name: "New" };

export default function ReusableDropdown({
  items = [],
  label = "Assigned to",
  value = null,
  onChange,
  drawerId,
}: ReusableDropdownProps) {
  const [query, setQuery] = useState("");
  const { openDrawer } = useDrawer();

  // Sort items alphabetically by name
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const nameA = (a.name || "").toLowerCase();
      const nameB = (b.name || "").toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [items]);

  const filteredItems =
    query === ""
      ? sortedItems
      : sortedItems.filter((item: any) => {
          return item.name.toLowerCase().includes(query.toLowerCase());
        });

  const handleChange = (selectedItem: any) => {
    setQuery("");
    
    // Check if "New" option was selected
    if (selectedItem && selectedItem.id === NEW_OPTION_VALUE.id) {
      if (drawerId) {
        openDrawer(drawerId);
      }
      // Don't call onChange for "New" option
      return;
    }
    
    // For regular items, call onChange
    if (onChange) {
      onChange(selectedItem);
    }
  };

  return (
    <Combobox as="div" value={value} onChange={handleChange}>
      <Label className="block text-sm/6 font-medium text-gray-900">{label}</Label>
      <div className="relative mt-2">
        <ComboboxInput
          className="block w-full rounded-md bg-white py-1.5 pr-12 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
          onChange={(event) => setQuery(event.target.value)}
          onBlur={() => setQuery("")}
          displayValue={(item: any) => item?.name || ""}
        />
        <ComboboxButton className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-hidden">
          <ChevronDownIcon className="size-5 text-gray-400" aria-hidden="true" />
        </ComboboxButton>

        <ComboboxOptions
          transition
          className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg outline outline-black/5 data-leave:transition data-leave:duration-100 data-leave:ease-in data-closed:data-leave:opacity-0 sm:text-sm"
        >
          {query.length > 0 && (
            <ComboboxOption
              value={{ id: null, name: query }}
              className="cursor-default px-3 py-2 text-gray-900 select-none data-focus:bg-indigo-600 data-focus:text-white data-focus:outline-hidden"
            >
              {query}
            </ComboboxOption>
          )}
          {filteredItems.map((item) => {
            const itemKey = item.id !== undefined ? item.id : item.name;
            return (
              <ComboboxOption
                key={itemKey}
                value={item}
                className="cursor-default px-3 py-2 text-gray-900 select-none data-focus:bg-indigo-600 data-focus:text-white data-focus:outline-hidden"
              >
                <span className="block truncate">{item.name}</span>
              </ComboboxOption>
            );
          })}
          {/* Always show "New" option at the end */}
          <ComboboxOption
            value={NEW_OPTION_VALUE}
            className="cursor-default px-3 py-2 text-gray-900 select-none data-focus:bg-indigo-600 data-focus:text-white data-focus:outline-hidden border-t border-gray-200 mt-1 pt-2"
          >
            <span className="block truncate font-medium">New</span>
          </ComboboxOption>
        </ComboboxOptions>
      </div>
    </Combobox>
  );
}
