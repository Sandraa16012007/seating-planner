"use client";

import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";

import { XIcon } from "@/components/ui/icons";

type ModalProps = {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  onClose: () => void;
};

/**
 * A native modal dialog. It traps focus, closes on Escape/backdrop click, and
 * becomes a bottom sheet on mobile and a centered panel on larger screens.
 */
export default function Modal({
  title,
  description,
  children,
  onClose,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    dialog.showModal();

    return () => {
      document.body.style.overflow = previousOverflow;

      if (dialog.open) {
        dialog.close();
      }
    };
  }, []);

  return (
    <dialog
      aria-describedby={description ? descriptionId : undefined}
      aria-labelledby={titleId}
      className="fixed inset-x-0 bottom-0 top-auto m-0 max-h-[90dvh] w-full max-w-none overflow-hidden rounded-t-[28px] bg-white p-0 text-left text-ink shadow-[0_24px_80px_-20px_rgba(45,30,35,0.35)] backdrop:bg-stone-950/40 sm:inset-0 sm:m-auto sm:max-h-[85dvh] sm:w-[min(92vw,560px)] sm:rounded-[28px]"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      ref={dialogRef}
    >
      <div className="flex max-h-[90dvh] flex-col sm:max-h-[85dvh]">
        <div className="shrink-0 border-b border-stone-100 px-5 pb-4 pt-3 sm:px-6 sm:pt-5">
          <div
            aria-hidden="true"
            className="mx-auto mb-3 h-1 w-10 rounded-full bg-stone-200 sm:hidden"
          />

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2
                className="font-serif text-2xl leading-tight text-ink"
                id={titleId}
              >
                {title}
              </h2>
              {description ? (
                <p
                  className="mt-1 text-sm leading-5 text-stone-500"
                  id={descriptionId}
                >
                  {description}
                </p>
              ) : null}
            </div>

            <button
              aria-label="Close"
              className="-mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-stone-400 transition hover:bg-stone-100 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
              onClick={onClose}
              type="button"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pb-6">
          {children}
        </div>
      </div>
    </dialog>
  );
}
