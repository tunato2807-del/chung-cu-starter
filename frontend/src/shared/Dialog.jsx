import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { ErrorBox } from "./ui.jsx";
import { enterDialog, topDialog } from "./dialog-state.js";
import { PageAction, PageActions } from "./PageActions.jsx";
import { DialogErrorContext } from "./dialog-feedback.js";
import "./Dialog.css";

const BusyContext = createContext(null);

export function useDialogBusy(pending) {
  const update = useContext(BusyContext);
  const id = useId();
  useLayoutEffect(() => {
    if (!update) return;
    update(id, !!pending);
    return () => update(id, false);
  }, [update, id, pending]);
}

export default function Dialog({
  open = true,
  title,
  children,
  onClose,
  pending = false,
  error,
  wide = false,
  footer = true,
  className = "",
  closeOnSuccess = false,
}) {
  const ref = useRef(null);
  const titleId = useId();
  const attempted = useRef(false);
  const [busy, setBusy] = useState(new Set());
  const updateBusy = useCallback((id, active) => {
    setBusy((previous) => {
      if (previous.has(id) === active) return previous;
      const next = new Set(previous);
      if (active) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);
  const blocked = pending || busy.size > 0;
  useLayoutEffect(() => {
    if (!open) return;
    return enterDialog(ref.current);
  }, [open]);
  useEffect(() => {
    if (!open) {
      attempted.current = false;
      return;
    }
    if (pending) attempted.current = true;
    else if (closeOnSuccess && attempted.current && !error) {
      attempted.current = false;
      onClose?.();
    }
  }, [open, pending, error, closeOnSuccess, onClose]);
  if (!open) return null;
  function close() {
    if (!blocked && topDialog() === ref.current) onClose?.();
  }
  return createPortal(
    <dialog
      ref={ref}
      className={`workflow-dialog${wide ? " workflow-dialog--wide" : ""} ${className}`}
      aria-labelledby={titleId}
      aria-modal="true"
      aria-busy={blocked}
      onCancel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        close();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Tab" || topDialog() !== ref.current) return;
        const elements = [
          ...ref.current.querySelectorAll(
            "a[href],button,input,select,textarea,[tabindex]",
          ),
        ].filter(
          (node) =>
            node.tabIndex >= 0 &&
            !node.matches(":disabled") &&
            node.getClientRects().length > 0,
        );
        const first = elements[0],
          last = elements.at(-1);
        const active = document.activeElement;
        if (!first) {
          event.preventDefault();
          return;
        }
        if (
          event.shiftKey &&
          (active === first || !ref.current.contains(active))
        ) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          (active === last || !ref.current.contains(active))
        ) {
          event.preventDefault();
          first.focus();
        }
      }}
    >
      <div className="workflow-dialog__header">
        <h2 id={titleId}>{title}</h2>
        <button
          type="button"
          className="workflow-dialog__close"
          aria-label="Đóng cửa sổ"
          disabled={blocked}
          onClick={close}
        >
          ×
        </button>
      </div>
      <div className="workflow-dialog__body">
        <BusyContext.Provider value={updateBusy}>
          <PageActions>
            <DialogErrorContext.Provider value={null}>
              <ErrorBox error={error} />
            </DialogErrorContext.Provider>
            <DialogErrorContext.Provider value={error || null}>
              {children}
            </DialogErrorContext.Provider>
          </PageActions>
        </BusyContext.Provider>
      </div>
      {footer && (
        <div className="workflow-dialog__footer">
          <button type="button" disabled={blocked} onClick={close}>
            Đóng
          </button>
        </div>
      )}
    </dialog>,
    document.body,
  );
}

export { PageAction };

// Existing mutation hooks keep ownership of API calls and validation. Only a
// completed attempt without an error dismisses an action panel.
export function ActionPanel({
  title,
  label,
  children,
  pending = false,
  error,
  editKey,
  onOpen,
  onDismiss,
  wide = false,
  inline = false,
}) {
  const [open, setOpen] = useState(false);
  const attempted = useRef(false);
  const dismiss = useCallback(() => {
    attempted.current = false;
    setOpen(false);
    onDismiss?.();
  }, [onDismiss]);
  useEffect(() => {
    if (editKey) setOpen(true);
  }, [editKey]);
  useEffect(() => {
    if (!open) return;
    if (pending) attempted.current = true;
    else if (attempted.current && !error) dismiss();
  }, [open, pending, error, dismiss]);
  const visibleError = attempted.current ? error : null;
  return (
    <>
      <PageAction inline={inline}>
        <button
          type="button"
          className="button primary workflow-trigger"
          disabled={pending}
          onClick={() => {
            attempted.current = false;
            onOpen?.();
            setOpen(true);
          }}
        >
          {label || title}
        </button>
      </PageAction>
      <Dialog
        open={open}
        title={title}
        onClose={dismiss}
        pending={pending}
        error={visibleError}
        wide={wide}
      >
        {children}
      </Dialog>
    </>
  );
}
