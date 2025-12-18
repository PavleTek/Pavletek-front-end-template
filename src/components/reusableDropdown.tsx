/**
 * Reusable Dropdown Component
 * 
 * Type-driven dropdown that:
 * - Accepts a mantenedor type
 * - Retrieves options from global state by type
 * - Renders item names
 * - Always appends a final "New" option
 * 
 * When "New" is selected:
 * - Emits an intent via onCreateNew callback
 * - Does NOT open drawers directly
 * - Does NOT know schemas
 * - Does NOT perform mutations
 */
"use client";

import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions, Label } from "@headlessui/react";
import { ChevronDownIcon, PlusIcon } from "@heroicons/react/20/solid";
import { useState, useMemo } from "react";
import { useMantenedores } from "../contexts/MantenedoresContext";
import type { MantenedorType, MantenedorBase } from "../types/mantenedores";

// ============================================
// Types
// ============================================

interface ReusableDropdownProps {
  // The mantenedor type to source options from
  type: MantenedorType;
  // Display label
  label?: string;
  // Current selected value (just the id, or full object)
  value?: number | string | MantenedorBase | null;
  // Called when selection changes (receives the selected item or null)
  onChange?: (item: MantenedorBase | null) => void;
  // Called when "New" is selected - parent handles opening drawer
  onCreateNew?: (type: MantenedorType) => void;
  // Whether the field is required
  required?: boolean;
  // Placeholder text
  placeholder?: string;
  // Whether to show the "New" option
  showNewOption?: boolean;
  // Additional className for the container
  className?: string;
}

// Sentinel value for the "New" option
const NEW_OPTION_ID = '__NEW__';

// ============================================
// Component
// ============================================

export default function ReusableDropdown({
  type,
  label,
  value = null,
  onChange,
  onCreateNew,
  required = false,
  placeholder = "Select an option...",
  showNewOption = true,
  className = "",
}: ReusableDropdownProps) {
  const [query, setQuery] = useState("");
  const { getItemsByType, isLoading } = useMantenedores();

  // Get items for this type from global state
  const items = useMemo(() => {
    return getItemsByType(type);
  }, [getItemsByType, type]);

  // Sort items alphabetically by name
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const nameA = (a.name || "").toLowerCase();
      const nameB = (b.name || "").toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [items]);

  // Filter items based on query
  const filteredItems = useMemo(() => {
    if (query === "") return sortedItems;
    return sortedItems.filter((item) =>
      item.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [sortedItems, query]);

  // Resolve value to a full item object
  const selectedItem = useMemo((): MantenedorBase | null => {
    if (!value) return null;
    
    // If value is already an object with id and name, use it
    if (typeof value === 'object' && value !== null && 'id' in value && 'name' in value) {
      return value as MantenedorBase;
    }
    
    // Otherwise, find the item by id (value is a primitive id)
    const searchId = value;
    return items.find(item => 
      item.id === searchId || String(item.id) === String(searchId)
    ) || null;
  }, [value, items]);

  // Handle selection change
  const handleChange = (selected: MantenedorBase | { id: string; name: string } | null) => {
    setQuery("");

    // Check if "New" option was selected
    if (selected && 'id' in selected && selected.id === NEW_OPTION_ID) {
      if (onCreateNew) {
        onCreateNew(type);
      }
      return;
    }

    // For regular items, call onChange
    if (onChange) {
      onChange(selected as MantenedorBase | null);
    }
  };

  return (
    <Combobox as="div" value={selectedItem} onChange={handleChange} className={className}>
      {label && (
        <Label className="block text-sm/6 font-medium text-gray-900">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <div className="relative mt-2">
        <ComboboxInput
          className="block w-full rounded-md bg-white py-1.5 pr-12 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
          onChange={(event) => setQuery(event.target.value)}
          onBlur={() => setQuery("")}
          displayValue={(item: MantenedorBase | null) => item?.name || ""}
          placeholder={isLoading ? "Loading..." : placeholder}
          disabled={isLoading}
        />
        <ComboboxButton className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-hidden">
          <ChevronDownIcon className="size-5 text-gray-400" aria-hidden="true" />
        </ComboboxButton>

        <ComboboxOptions
          transition
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg outline outline-black/5 data-leave:transition data-leave:duration-100 data-leave:ease-in data-closed:data-leave:opacity-0 sm:text-sm"
        >
          {/* Show typed query as an option if different from existing items */}
          {query.length > 0 && !filteredItems.some(item => 
            item.name.toLowerCase() === query.toLowerCase()
          ) && (
            <ComboboxOption
              value={{ id: `new-${query}`, name: query } as MantenedorBase}
              className="cursor-default px-3 py-2 text-gray-900 select-none data-focus:bg-indigo-600 data-focus:text-white data-focus:outline-hidden"
            >
              <span className="block truncate italic">Create "{query}"</span>
            </ComboboxOption>
          )}

          {/* Existing items */}
          {filteredItems.map((item) => (
            <ComboboxOption
              key={item.id}
              value={item}
              className="cursor-default px-3 py-2 text-gray-900 select-none data-focus:bg-indigo-600 data-focus:text-white data-focus:outline-hidden"
            >
              <span className="block truncate">{item.name}</span>
            </ComboboxOption>
          ))}

          {/* Empty state */}
          {filteredItems.length === 0 && query === "" && !isLoading && (
            <div className="px-3 py-2 text-gray-500 text-sm">
              No items available
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="px-3 py-2 text-gray-500 text-sm">
              Loading...
            </div>
          )}

          {/* "New" option - always at the end */}
          {showNewOption && onCreateNew && (
            <ComboboxOption
              value={{ id: NEW_OPTION_ID, name: "New" }}
              className="cursor-default px-3 py-2 text-gray-900 select-none data-focus:bg-indigo-600 data-focus:text-white data-focus:outline-hidden border-t border-gray-200 mt-1 pt-2"
            >
              <span className="flex items-center gap-2 font-medium">
                <PlusIcon className="size-4" />
                Add New
              </span>
            </ComboboxOption>
          )}
        </ComboboxOptions>
      </div>
    </Combobox>
  );
}
