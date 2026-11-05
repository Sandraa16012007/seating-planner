"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { getOwnedStudentAction } from "@/app/actions/seating";
import AddStudentForm from "@/components/seating/AddStudentForm";
import SeatingSummary from "@/components/seating/SeatingSummary";
import TableDetails from "@/components/seating/TableDetails";
import TableGrid from "@/components/seating/TableGrid";
import Modal from "@/components/ui/Modal";
import { clearOwnershipToken, readOwnershipToken } from "@/lib/ownership-token";
import type { SeatingPlan } from "@/types/seating";

type View =
  | { kind: "details"; tableNumber: number }
  | { kind: "add"; tableNumber: number; fromDetails: boolean };

type DetailsNotice = {
  id: string;
  message: string;
};

type OwnershipStatus = "loading" | "none" | "owned" | "error";

type SeatingPlannerProps = {
  plan: SeatingPlan;
};

export default function SeatingPlanner({ plan }: SeatingPlannerProps) {
  const [view, setView] = useState<View | null>(null);
  const [detailsNotice, setDetailsNotice] = useState<DetailsNotice | null>(
    null,
  );
  const [ownershipToken, setOwnershipToken] = useState<string | null>(null);
  const [ownedStudentId, setOwnedStudentId] = useState<string | null>(null);
  const [ownershipStatus, setOwnershipStatus] =
    useState<OwnershipStatus>("loading");
  const noticeSequence = useRef(0);
  const router = useRouter();
  const [, startTransition] = useTransition();

  const refreshPlan = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
  }, [router, startTransition]);

  useEffect(() => {
    let active = true;
    const token = readOwnershipToken();

    if (!token) {
      // Defer out of the effect body so hydration and the first paint stay
      // stable, then unlock registration.
      queueMicrotask(() => {
        if (active) {
          setOwnershipStatus("none");
        }
      });

      return () => {
        active = false;
      };
    }

    getOwnedStudentAction(token)
      .then((result) => {
        if (!active) {
          return;
        }

        if (result.status === "found") {
          setOwnershipToken(token);
          setOwnedStudentId(result.studentId);
          setOwnershipStatus("owned");
          return;
        }

        setOwnedStudentId(null);
        setOwnershipStatus(result.status === "none" ? "none" : "error");
      })
      .catch(() => {
        if (active) {
          setOwnedStudentId(null);
          setOwnershipStatus("error");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleAdded = useCallback(
    (studentId: string, token: string) => {
      setOwnershipToken(token);
      setOwnedStudentId(studentId);
      setOwnershipStatus("owned");
      refreshPlan();
    },
    [refreshPlan],
  );

  const handleRemoved = useCallback(
    (studentName: string) => {
      // The database has already confirmed ownership and deleted the row. Only
      // now is it safe to forget this browser's token.
      clearOwnershipToken();
      setOwnershipToken(null);
      setOwnedStudentId(null);
      setOwnershipStatus("none");
      noticeSequence.current += 1;
      setDetailsNotice({
        id: String(noticeSequence.current),
        message: `${studentName} was removed. Their seat is now free.`,
      });
      refreshPlan();
    },
    [refreshPlan],
  );

  useEffect(() => {
    if (!detailsNotice) {
      return;
    }

    const timeout = window.setTimeout(() => setDetailsNotice(null), 5000);

    return () => window.clearTimeout(timeout);
  }, [detailsNotice]);

  useEffect(() => {
    if (!view) {
      return;
    }

    document
      .querySelector<HTMLButtonElement>(
        'dialog[open] button[aria-label="Close"]',
      )
      ?.focus();
  }, [view]);

  const activeTable = view
    ? (plan.find((table) => table.tableNumber === view.tableNumber) ?? null)
    : null;

  const currentOwnedStudent = ownedStudentId
    ? (plan
        .flatMap((table) => table.students)
        .find((student) => student.id === ownedStudentId) ?? null)
    : null;
  const canRegister = ownershipStatus === "none";
  const registrationPending = ownershipStatus === "loading";

  function openDetails(tableNumber: number) {
    setDetailsNotice(null);
    setView({ kind: "details", tableNumber });
  }

  function openAdd(tableNumber: number, fromDetails: boolean) {
    setDetailsNotice(null);
    setView({ kind: "add", tableNumber, fromDetails });
  }

  function close() {
    setDetailsNotice(null);
    setView(null);
  }

  function cancelAdd() {
    if (view?.kind === "add" && view.fromDetails) {
      setView({ kind: "details", tableNumber: view.tableNumber });
      return;
    }

    close();
  }

  return (
    <>
      <SeatingSummary plan={plan} />

      {currentOwnedStudent ? (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/80 px-4 py-3 text-sm leading-6 text-emerald-900">
          <span
            aria-hidden="true"
            className="mt-2 h-2 w-2 shrink-0 rounded-full bg-emerald-500"
          />
          <p>
            <strong className="font-semibold">You&apos;re registered</strong> as{" "}
            {currentOwnedStudent.name} in {currentOwnedStudent.classSection} at
            Table {currentOwnedStudent.tableNumber}. Only this browser can remove
            that entry.
          </p>
        </div>
      ) : ownershipStatus === "error" ? (
        <div
          className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800"
          role="status"
        >
          We couldn&apos;t check this browser&apos;s registration. Reload the
          page before registering.
        </div>
      ) : null}

      <TableGrid
        canRegister={canRegister}
        onAddStudent={(tableNumber) => openAdd(tableNumber, false)}
        onOpenDetails={openDetails}
        plan={plan}
        registrationPending={registrationPending}
      />

      {view && activeTable ? (
        <Modal
          description={
            view.kind === "details"
              ? "See who's seated. Your own entry is the only one you can remove."
              : "Register yourself once. Names are unique across all tables."
          }
          onClose={view.kind === "add" ? cancelAdd : close}
          title={
            view.kind === "details"
              ? `Table ${activeTable.tableNumber}`
              : "Add a student"
          }
        >
          {view.kind === "details" ? (
            <TableDetails
              canRegister={canRegister}
              notice={detailsNotice}
              onAdd={() => openAdd(activeTable.tableNumber, true)}
              onClose={close}
              onRemoved={handleRemoved}
              ownedStudentId={ownedStudentId}
              ownershipToken={ownershipToken}
              registrationPending={registrationPending}
              table={activeTable}
            />
          ) : (
            <AddStudentForm
              cancelLabel={view.fromDetails ? "Back to table" : "Cancel"}
              initialTableNumber={activeTable.tableNumber}
              onAdded={handleAdded}
              onCancel={cancelAdd}
              plan={plan}
              registrationLocked={!canRegister && !registrationPending}
            />
          )}
        </Modal>
      ) : null}
    </>
  );
}
