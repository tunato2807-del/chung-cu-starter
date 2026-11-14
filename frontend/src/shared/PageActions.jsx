import React, { createContext, useContext, useState } from "react";
import { createPortal } from "react-dom";

const ActionHost = createContext(null);

export function PageActions({ children }) {
  const [host, setHost] = useState(null);
  return (
    <ActionHost.Provider value={host}>
      <div
        className="page-dialog-actions"
        ref={setHost}
        aria-label="Thao tác của trang"
      />
      {children}
    </ActionHost.Provider>
  );
}

export function PageAction({ children, inline = false }) {
  const host = useContext(ActionHost);
  return host && !inline ? createPortal(children, host) : children;
}
