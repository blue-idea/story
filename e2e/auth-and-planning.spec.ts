import { expect, test } from "@playwright/test";

test.setTimeout(120_000);

test("auth-and-planning：登录页到大纲编辑旅程", async ({ page }, testInfo) => {
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: "Sign in to keep writing." }),
  ).toBeVisible();

  await page.getByLabel("Email").fill("user@novelist.local");
  await page.getByLabel("Password").fill("User123!");
  await page.screenshot({
    path: testInfo.outputPath("task-019-login.png"),
    fullPage: true,
  });

  await page.goto("/qa/task-013");
  await expect(page.getByText("Preferred genres")).toBeVisible();
  await page
    .getByRole("link", { name: "Start New Novel" })
    .click({ force: true });
  if (!page.url().includes("/qa/task-014")) {
    await page.goto("/qa/task-014");
  }

  await expect(page).toHaveURL(/\/qa\/task-014$/);
  await expect(
    page.getByRole("heading", { name: "Novel Creation Wizard" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Sci-Fi" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page
    .getByPlaceholder("Name, role, and identity")
    .fill("Lin Xia, investigative reporter");
  await page.getByRole("button", { name: "Continue" }).click();
  await page
    .getByPlaceholder("Main tension, risk, and stakes")
    .fill("Trace the missing disaster audio before the next live broadcast.");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByRole("button", { name: "Enter Layer 2" }).click();
  await page
    .getByPlaceholder("Optional world setup")
    .fill("Near-future city with legacy broadcast relay towers.");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByRole("button", { name: "First Person" }).click();
  await page.getByRole("button", { name: "Noir" }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByRole("button", { name: "Growth" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "General readers" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "12 chapters" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Confirm Configuration" }).click();

  await expect(
    page.getByRole("heading", { name: "Title candidates" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Neon Meridian" }).click();
  await page.getByRole("button", { name: "Confirm Title" }).click();

  await expect(page).toHaveURL(/\/qa\/task-019\/plan$/);
  await expect(page.getByText("Story architecture")).toBeVisible();
  await page.getByRole("button", { name: "Edit Outline" }).first().click();
  await page
    .getByRole("textbox", { name: "Outline Summary" })
    .fill(
      "章节定位: 开端 | 核心事件: 林夏重新解码灾难录音并定位广播塔 | 冲突升级: 备份再次被清除 | 章节悬念: 录音中出现内部代号",
    );
  await page.getByRole("button", { name: "Save Outline" }).click();
  await expect(page.getByText("Saved.")).toBeVisible();

  await page.screenshot({
    path: testInfo.outputPath("task-019-planning.png"),
    fullPage: true,
  });
});
