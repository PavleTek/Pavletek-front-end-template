import React from "react";
import { XCircleIcon, XMarkIcon } from "@heroicons/react/20/solid";

interface ErrorBannerProps {
  message: string | string[];
  onDismiss: () => void;
}

const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onDismiss }) => {
  const messages = Array.isArray(message) ? message : [message];
  const hasMultipleErrors = messages.length > 1;

  return (
    <div className="rounded-md bg-red-50 p-4">
      <div className="flex">
        <div className="shrink-0">
          <XCircleIcon aria-hidden="true" className="size-5 text-red-400" />
        </div>
        <div className="ml-3">
          {hasMultipleErrors ? (
            <>
              <h3 className="text-sm font-medium text-red-800">
                There {messages.length === 1 ? "was" : "were"} {messages.length} error{messages.length > 1 ? "s" : ""} with your submission
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <ul role="list" className="list-disc space-y-1 pl-5">
                  {messages.map((msg, index) => (
                    <li key={index}>{msg}</li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <p className="text-sm font-medium text-red-800">{messages[0]}</p>
          )}
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              type="button"
              onClick={onDismiss}
              className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 focus-visible:ring-offset-red-50 focus-visible:outline-hidden cursor-pointer"
            >
              <span className="sr-only">Dismiss</span>
              <XMarkIcon aria-hidden="true" className="size-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorBanner;

