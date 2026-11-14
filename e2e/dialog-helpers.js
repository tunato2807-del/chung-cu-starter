// Scope text assertions to the active native dialog. Background screens stay
// mounted to preserve their filters and scroll position during a workflow.
export const activeView = (page) =>
  page.locator(
    "body:not(:has(dialog[open])), body > dialog[open]:not(:has(~ dialog[open]))",
  );
export async function openAction(page, name) {
  await activeView(page).getByRole("button", { name, exact: true }).click();
}
export async function closeDialog(page) {
  await page
    .getByRole("dialog")
    .last()
    .getByRole("button", { name: "Đóng cửa sổ", exact: true })
    .click();
}
