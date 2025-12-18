/**
 * Mantenedor Drawer Component
 * 
 * Schema-driven drawer that:
 * - Receives the mantenedor type to create/edit
 * - Loads the UI schema for that type
 * - Dynamically renders fields based on schema
 * - Manages form state locally
 * - Submits data using the generic backend endpoint
 * 
 * On successful creation:
 * - Inserts the new item into the global store
 * - Closes the drawer
 * - Calls optional onSuccess callback
 * 
 * Does NOT:
 * - Contain type-specific conditionals
 * - Fetch dropdown data (uses global state)
 * - Handle global version logic (context handles that)
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useDrawer } from "../contexts/DrawerContext";
import { useMantenedores } from "../contexts/MantenedoresContext";
import { getUISchema, type MantenedorType, type UIFieldSchema } from "../types/mantenedores";
import ReusableDropdown from "./reusableDropdown";

// ============================================
// Types
// ============================================

interface MantenedorDrawerProps {
  drawerId: string;
}

interface FormState {
  [key: string]: any;
}

// ============================================
// Field Renderer Components
// ============================================

interface FieldRendererProps {
  field: UIFieldSchema;
  value: any;
  onChange: (value: any) => void;
  onNestedCreate?: (type: MantenedorType) => void;
  error?: string;
}

function FieldRenderer({ field, value, onChange, onNestedCreate, error }: FieldRendererProps) {
  const baseInputClass = "block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6";
  const errorClass = error ? "outline-red-500" : "";

  switch (field.type) {
    case 'text':
      return (
        <div>
          <label htmlFor={field.name} className="block text-sm/6 font-medium text-gray-900">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <div className="mt-2">
            <input
              id={field.name}
              name={field.name}
              type="text"
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
              placeholder={field.placeholder}
              className={`${baseInputClass} ${errorClass}`}
            />
          </div>
          {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
      );

    case 'number':
      return (
        <div>
          <label htmlFor={field.name} className="block text-sm/6 font-medium text-gray-900">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <div className="mt-2">
            <input
              id={field.name}
              name={field.name}
              type="number"
              value={value ?? ""}
              onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
              placeholder={field.placeholder}
              className={`${baseInputClass} ${errorClass}`}
            />
          </div>
          {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
      );

    case 'textarea':
      return (
        <div>
          <label htmlFor={field.name} className="block text-sm/6 font-medium text-gray-900">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <div className="mt-2">
            <textarea
              id={field.name}
              name={field.name}
              rows={3}
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
              placeholder={field.placeholder}
              className={`${baseInputClass} ${errorClass}`}
            />
          </div>
          {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
      );

    case 'checkbox':
      return (
        <div className="flex items-center gap-3">
          <input
            id={field.name}
            name={field.name}
            type="checkbox"
            checked={value || false}
            onChange={(e) => onChange(e.target.checked)}
            className="size-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
          />
          <label htmlFor={field.name} className="text-sm/6 font-medium text-gray-900">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
      );

    case 'dropdown':
      if (!field.sourceType) {
        console.error(`Dropdown field "${field.name}" missing sourceType`);
        return null;
      }
      return (
        <div>
          <ReusableDropdown
            type={field.sourceType}
            label={field.label}
            value={value}
            onChange={(item) => onChange(item?.id || null)}
            onCreateNew={onNestedCreate}
            required={field.required}
            placeholder={field.placeholder || `Select ${field.label.toLowerCase()}...`}
            showNewOption={!!onNestedCreate}
          />
          {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
      );

    default:
      console.warn(`Unknown field type: ${field.type}`);
      return null;
  }
}

// ============================================
// Main Component
// ============================================

export default function MantenedorDrawer({ drawerId }: MantenedorDrawerProps) {
  const { isDrawerOpen, closeDrawer, getDrawerZIndex, getDrawerConfig, openDrawer } = useDrawer();
  const { createMantenedor } = useMantenedores();

  const open = isDrawerOpen(drawerId);
  const zIndex = getDrawerZIndex(drawerId);
  const config = getDrawerConfig(drawerId);

  // Get the type from drawer config
  const mantenedorType = config?.type as MantenedorType | undefined;
  const schema = mantenedorType ? getUISchema(mantenedorType) : null;

  // Form state
  const [formData, setFormData] = useState<FormState>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Reset form when drawer opens with new type
  useEffect(() => {
    if (open && schema) {
      const initialData: FormState = {};
      schema.fields.forEach((field) => {
        initialData[field.name] = field.type === 'checkbox' ? false : '';
      });
      setFormData(initialData);
      setErrors({});
      setSubmitError(null);
    }
  }, [open, mantenedorType, schema]);

  // Handle field change
  const handleFieldChange = useCallback((fieldName: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    // Clear error for this field when user changes it
    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  }, [errors]);

  // Handle nested creation (when user clicks "New" in a dropdown)
  const handleNestedCreate = useCallback((type: MantenedorType) => {
    // Open a new drawer for this type with a unique ID to allow stacking
    const nestedDrawerId = `mantenedor-${type}-${Date.now()}`;
    openDrawer(nestedDrawerId, { type });
  }, [openDrawer]);

  // Validate form
  const validateForm = useCallback((): boolean => {
    if (!schema) return false;

    const newErrors: Record<string, string> = {};

    schema.fields.forEach((field) => {
      const value = formData[field.name];
      
      if (field.required) {
        if (value === undefined || value === null || value === '') {
          newErrors[field.name] = `${field.label} is required`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [schema, formData]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!mantenedorType || !validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Build the request data
      const { name, ...data } = formData;

      await createMantenedor({
        type: mantenedorType,
        name: name as string,
        ...data,
      });

      // Success - close drawer
      closeDrawer(drawerId);

      // Call success callback if provided
      if (config?.onSuccess) {
        config.onSuccess();
      }
    } catch (error: any) {
      console.error('Error creating mantenedor:', error);
      
      // Handle validation errors from backend
      if (error.response?.data?.errors) {
        const backendErrors = error.response.data.errors;
        if (Array.isArray(backendErrors)) {
          setSubmitError(backendErrors.join(', '));
        } else {
          setSubmitError('Validation failed');
        }
      } else if (error.response?.data?.error) {
        setSubmitError(error.response.data.error);
      } else {
        setSubmitError('Failed to create. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle close
  const handleClose = () => {
    closeDrawer(drawerId);
  };

  // Don't render anything if no schema available
  if (!schema) {
    return null;
  }

  return (
    <Dialog open={open} onClose={handleClose} className="relative" style={{ zIndex }}>
      <div className="fixed inset-0" />

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
              <DialogPanel
                transition
                className="pointer-events-auto w-screen max-w-md transform transition duration-500 ease-in-out data-closed:translate-x-full sm:duration-700"
              >
              <form 
                onSubmit={handleSubmit}
                className="flex h-full flex-col divide-y divide-gray-200 bg-white shadow-xl"
              >
                {/* Header */}
                  <div className="h-0 flex-1 overflow-y-auto">
                    <div className="bg-indigo-700 px-4 py-6 sm:px-6">
                      <div className="flex items-center justify-between">
                      <DialogTitle className="text-base font-semibold text-white">
                        New {schema.title}
                      </DialogTitle>
                        <div className="ml-3 flex h-7 items-center">
                        <button
                          type="button"
                          onClick={handleClose}
                          className="relative cursor-pointer rounded-md text-indigo-200 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                        >
                            <span className="absolute -inset-2.5" />
                            <span className="sr-only">Close panel</span>
                            <XMarkIcon aria-hidden="true" className="size-6" />
                          </button>
                        </div>
                      </div>
                    {schema.description && (
                      <div className="mt-1">
                        <p className="text-sm text-indigo-300">{schema.description}</p>
                      </div>
                    )}
                    </div>

                  {/* Form Fields */}
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="divide-y divide-gray-200 px-4 sm:px-6">
                        <div className="space-y-6 pt-6 pb-5">
                        {/* Submit error */}
                        {submitError && (
                          <div className="rounded-md bg-red-50 p-4">
                            <div className="flex">
                              <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Error</h3>
                                <div className="mt-2 text-sm text-red-700">
                                  {submitError}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Dynamic fields from schema */}
                        {schema.fields.map((field) => (
                          <FieldRenderer
                            key={field.name}
                            field={field}
                            value={formData[field.name]}
                            onChange={(value) => handleFieldChange(field.name, value)}
                            onNestedCreate={handleNestedCreate}
                            error={errors[field.name]}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                  <div className="flex shrink-0 justify-end px-4 py-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isSubmitting}
                      className="cursor-pointer rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="cursor-pointer ml-4 inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </form>
              </DialogPanel>
            </div>
          </div>
        </div>
      </Dialog>
  );
}
