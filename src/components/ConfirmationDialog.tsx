import React from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Dialog, DialogPanel, DialogTitle, DialogBackdrop } from "@headlessui/react";

interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  variant: "orange" | "red";
  title: string;
  message: string;
  confirmButtonText: string;
  cancelButtonText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onClose,
  variant,
  title,
  message,
  confirmButtonText,
  cancelButtonText = "Cancel",
  onConfirm,
  onCancel,
}) => {
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  const iconBgColor = variant === "orange" ? "bg-orange-100" : "bg-red-100";
  const iconTextColor = variant === "orange" ? "text-orange-600" : "text-red-600";
  const buttonBgColor = variant === "orange" ? "bg-orange-600 hover:bg-orange-500" : "bg-red-600 hover:bg-red-500";
  const buttonFocusColor = variant === "orange" ? "focus-visible:outline-orange-600" : "focus-visible:outline-red-600";

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
      />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel
            transition
            className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg data-closed:sm:translate-y-0 data-closed:sm:scale-95"
          >
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className={`mx-auto flex size-12 shrink-0 items-center justify-center rounded-full ${iconBgColor} sm:mx-0 sm:size-10`}>
                  <ExclamationTriangleIcon aria-hidden="true" className={`size-6 ${iconTextColor}`} />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <DialogTitle as="h3" className="text-base font-semibold text-gray-900">
                    {title}
                  </DialogTitle>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">{message}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              <button
                type="button"
                onClick={onConfirm}
                className={`inline-flex w-full justify-center rounded-md ${buttonBgColor} px-3 py-2 text-sm font-semibold text-white shadow-xs sm:ml-3 sm:w-auto cursor-pointer ${buttonFocusColor}`}
              >
                {confirmButtonText}
              </button>
              <button
                type="button"
                data-autofocus
                onClick={handleCancel}
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring inset-ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto cursor-pointer"
              >
                {cancelButtonText}
              </button>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
};

export default ConfirmationDialog;

