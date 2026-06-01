import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

test.setTimeout(120_000);

test("writing-fault-retry：故障暂停、重试恢复与导出下载", async ({
  page,
}, testInfo) => {
  await page.goto("/qa/task-019/plan");
  await page
    .getByRole("button", { name: "Confirm and Write" })
    .click({ force: true });

  if (!page.url().includes("/qa/task-016")) {
    await page.goto("/qa/task-016");
  }

  await expect(page).toHaveURL(/\/qa\/task-016$/);
  await expect(
    page.getByRole("heading", {
      name: "Writing paused on a recoverable error.",
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Upstream provider timeout").first(),
  ).toBeVisible();

  await page
    .getByRole("button", { name: "Retry Chapter Writing" })
    .click({ force: true });
  await expect(
    page.getByText("Retry requested. Reconnecting to the writing stream."),
  ).toBeVisible();
  await expect(page.getByText("Novel completed.")).toBeVisible();

  await page.screenshot({
    path: testInfo.outputPath("task-019-retry-complete.png"),
    fullPage: true,
  });

  await page.goto("/qa/task-019/export");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Export Markdown" }).click();
  const download = await downloadPromise;
  const targetFile = testInfo.outputPath("qa-task-019.md");
  await download.saveAs(targetFile);

  const exported = readFileSync(targetFile, "utf8");
  expect(exported).toContain("# QA Export Novel");
  expect(exported).toContain("Chapter 1 - Rain Signal");
});
