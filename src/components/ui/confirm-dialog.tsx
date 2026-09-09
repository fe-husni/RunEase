/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

type Deco = "red" | "blue" | "yellow";

export interface ConfirmOptions {
  title: string;
  message?: string;
  /** Label tombol aksi. Default "Ya". */
  confirmLabel?: string;
  /** Label tombol batal. Default "Batal". */
  cancelLabel?: string;
  /** Warna deco + tombol aksi. Default "red" (aksi destruktif). */
  variant?: Deco;
}

export interface NotifyOptions {
  title: string;
  message?: string;
  /** Label tombol tutup. Default "Mengerti". */
  label?: string;
  variant?: Deco;
}

interface PendingRequest {
  kind: "confirm" | "notify";
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel: string;
  variant: Deco;
  resolve: (value: boolean) => void;
}

interface ConfirmDialogContextValue {
  /** Pengganti `confirm()`: resolve true jika user tekan aksi, false jika batal/Esc/backdrop. */
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
  /** Pengganti `alert()`: dialog info 1 tombol. */
  notify: (opts: NotifyOptions) => Promise<void>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(null);

export function useConfirmDialog(): ConfirmDialogContextValue {
  const ctx = useContext(ConfirmDialogContext);
  if (!ctx) throw new Error("useConfirmDialog harus dipakai di dalam <ConfirmDialogProvider>");
  return ctx;
}

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<PendingRequest | null>(null);
  const requestRef = useRef<PendingRequest | null>(null);
  requestRef.current = request;

  const confirm = useCallback((opts: ConfirmOptions) => {
    // Batalkkan dialog lama yang belum dijawab (hindari promise menggantung)
    requestRef.current?.resolve(false);
    return new Promise<boolean>((resolve) => {
      setRequest({
        kind: "confirm",
        title: opts.title,
        message: opts.message,
        confirmLabel: opts.confirmLabel ?? "Ya",
        cancelLabel: opts.cancelLabel ?? "Batal",
        variant: opts.variant ?? "red",
        resolve,
      });
    });
  }, []);

  const notify = useCallback((opts: NotifyOptions) => {
    requestRef.current?.resolve(false);
    return new Promise<void>((resolve) => {
      setRequest({
        kind: "notify",
        title: opts.title,
        message: opts.message,
        confirmLabel: opts.label ?? "Mengerti",
        cancelLabel: "",
        variant: opts.variant ?? "blue",
        resolve: () => resolve(),
      });
    });
  }, []);

  const answer = useCallback((value: boolean) => {
    requestRef.current?.resolve(value);
    setRequest(null);
  }, []);

  return (
    <ConfirmDialogContext.Provider value={{ confirm, notify }}>
      {children}
      {request && (
        <ConfirmOverlay request={request} onAnswer={answer} />
      )}
    </ConfirmDialogContext.Provider>
  );
}

function ConfirmOverlay({ request, onAnswer }: { request: PendingRequest; onAnswer: (v: boolean) => void }) {
  const isConfirm = request.kind === "confirm";

  // Esc = batal/tutup
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onAnswer(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onAnswer]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-bauhaus-black/60 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onAnswer(false);
      }}
    >
      <Card
        deco={request.variant}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby={request.message ? "confirm-dialog-desc" : undefined}
        className="w-full max-w-sm"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-bauhaus-black bg-bauhaus-yellow">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 id="confirm-dialog-title" className="font-black uppercase tracking-tight text-lg leading-tight">
              {request.title}
            </h2>
            {request.message && (
              <p id="confirm-dialog-desc" className="mt-1 text-sm font-medium opacity-70">
                {request.message}
              </p>
            )}
          </div>
        </div>
        <div className={`mt-6 grid gap-3 ${isConfirm ? "grid-cols-2" : "grid-cols-1"}`}>
          {isConfirm && (
            <Button variant="outline" shape="square" onClick={() => onAnswer(false)}>
              {request.cancelLabel}
            </Button>
          )}
          <Button
            variant={request.variant}
            shape="square"
            autoFocus
            onClick={() => onAnswer(isConfirm ? true : false)}
          >
            {request.confirmLabel}
          </Button>
        </div>
      </Card>
    </div>
  );
}
