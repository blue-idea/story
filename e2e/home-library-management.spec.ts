import { expect, test } from "@playwright/test";

test("home-library-management: 作品列表与删除交互预览", async ({
  page,
}, testInfo) => {
  await page.goto("/qa/task-013");

  await expect(
    page.getByRole("heading", { name: "All Your Stories" }),
  ).toBeVisible();
  await expect(page.getByText("Glass Harbour")).toBeVisible();
  await expect(page.getByText("Signal Choir")).toBeVisible();
  await expect(page.getByRole("link", { name: "Edit" }).first()).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Continue Writing" }).first(),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Read" })).toBeVisible();

  await page.screenshot({
    path: testInfo.outputPath("task-020-home-library-before.png"),
    fullPage: true,
  });

  page.once("dialog", (dialog) => dialog.accept());
  await page
    .locator('[data-novel-id="qa-task-013-draft"]')
    .getByRole("button", {
      name: "Delete",
    })
    .click();

  await expect(page.getByText("Glass Harbour")).toHaveCount(0);

  await page.screenshot({
    path: testInfo.outputPath("task-020-home-library-after-delete.png"),
    fullPage: true,
  });
});
