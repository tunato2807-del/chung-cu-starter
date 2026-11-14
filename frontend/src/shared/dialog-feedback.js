import { createContext } from "react";

// A form may already render its mutation error. When its dialog presents the
// same error at the top, avoid announcing that message twice.
export const DialogErrorContext = createContext(null);
