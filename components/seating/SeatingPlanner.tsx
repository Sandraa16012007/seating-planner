"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import AddStudentForm from "@/components/seating/AddStudentForm";
import SeatingSummary from "@/components/seating/SeatingSummary";
import TableDetails from "@/components/seating/TableDetails";
import TableGrid from "@/components/seating/TableGrid";
import Modal from "@/components/ui/Modal";
import type { SeatingPlan } from "@/types/seating";

type View =
  | { kind: "details"; tableNumber: number }
  | { kind: "add"; tableNumber: number; fromDetails: boolean };

type DetailsNotice = {
  id: string;
  message: string;
};

type SeatingPlannerProps = {
  plan: SeatingPlan;
};

export default function SeatingPlanner({ plan }: SeatingPlannerProps) {
  const [view, setView] = useState<View | null>(null);
  const [detailsNotice, setDetailsNotice] = useState<DetailsNotice | null>(
    null,
  );
  const noticeSequence = useRef(0);
  const router = useRouter();
  const [, startTransition] = useTransition();

  const refreshPlan = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
  }, [router, startTransition]);

  const handleAdded = useCallback(() => {
    refreshPlan();
  }, [refreshPlan]);

  const handleRemoved = useCallback(
    (studentName: string) => {
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

      <TableGrid
        onAddStudent={(tableNumber) => openAdd(tableNumber, false)}
        onOpenDetails={openDetails}
        plan={plan}
      />

      {view && activeTable ? (
        <Modal
          description={
            view.kind === "details"
              ? "See who's seated, add a friend, or free a seat."
              : "Add yourself or a friend. Names are unique across all tables."
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
              notice={detailsNotice}
              onAdd={() => openAdd(activeTable.tableNumber, true)}
              onClose={close}
              onRemoved={handleRemoved}
              table={activeTable}
            />
          ) : (
            <AddStudentForm
              cancelLabel={view.fromDetails ? "Back to table" : "Cancel"}
              initialTableNumber={activeTable.tableNumber}
              onAdded={handleAdded}
              onCancel={cancelAdd}
              plan={plan}
            />
          )}
        </Modal>
      ) : null}
    </>
  );
}
