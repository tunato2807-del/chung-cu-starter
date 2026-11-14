const dialogs = [];
let bodyStyle;

export const topDialog = () => dialogs.at(-1);

export function enterDialog(dialog) {
  const previous = document.activeElement;
  if (!dialogs.length) {
    bodyStyle = {
      overflow: document.body.style.overflow,
      paddingRight: document.body.style.paddingRight,
    };
    const gap = window.innerWidth - document.documentElement.clientWidth;
    const gutter =
      getComputedStyle(document.documentElement).scrollbarGutter || "";
    if (gap > 0 && !gutter.includes("stable")) {
      const padding =
        parseFloat(getComputedStyle(document.body).paddingRight) || 0;
      document.body.style.paddingRight = `${padding + gap}px`;
    }
    document.body.style.overflow = "hidden";
  }
  dialogs.push(dialog);
  dialog.showModal();
  return () => {
    if (dialog.open) dialog.close();
    const index = dialogs.indexOf(dialog);
    if (index >= 0) dialogs.splice(index, 1);
    const parent = topDialog();
    if (!dialogs.length && bodyStyle) {
      Object.assign(document.body.style, bodyStyle);
      bodyStyle = null;
    }
    if (
      previous?.isConnected &&
      !previous.matches?.(":disabled") &&
      (!parent || parent.contains(previous))
    ) {
      previous.focus?.({ preventScroll: true });
    } else {
      parent
        ?.querySelector("button:not(:disabled)")
        ?.focus({ preventScroll: true });
    }
  };
}
