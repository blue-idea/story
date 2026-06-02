import { expect, test } from "@playwright/test";

test.setTimeout(120_000);

test("auth-and-planning：登录页到大纲编辑旅程", async ({ page }, testInfo) => {
  await page.goto("/login");
  await expect(
    page.getByRole("heading", { name: "登录以继续创作" }),
  ).toBeVisible();

  await page.getByLabel("邮箱").fill("user@novelist.local");
  await page.getByLabel("密码").fill("User123!");
  await page.screenshot({
    path: testInfo.outputPath("task-019-login.png"),
    fullPage: true,
  });

  await page.goto("/qa/task-013");
  await expect(page.getByText("偏好题材")).toBeVisible();
  await page.getByRole("link", { name: "开始新小说" }).click({ force: true });
  if (!page.url().includes("/qa/task-014")) {
    await page.goto("/qa/task-014");
  }

  await expect(page).toHaveURL(/\/qa\/task-014$/);
  await expect(
    page.getByRole("heading", { name: "小说创作向导" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "科幻" }).click();
  await page.getByRole("button", { name: "继续" }).click();
  await page
    .getByPlaceholder("姓名、角色与身份背景")
    .fill("Lin Xia, investigative reporter");
  await page.getByRole("button", { name: "继续" }).click();
  await page
    .getByPlaceholder("主要矛盾、危机与利益攸关点")
    .fill("Trace the missing disaster audio before the next live broadcast.");
  await page.getByRole("button", { name: "继续" }).click();

  await page.getByRole("button", { name: "进入深度定制" }).click();
  await page
    .getByPlaceholder("选填，世界观设定")
    .fill("Near-future city with legacy broadcast relay towers.");
  await page.getByRole("button", { name: "继续" }).click();

  await page.getByRole("button", { name: "第一人称" }).click();
  await page.getByRole("button", { name: "黑色幽暗" }).click();
  await page.getByRole("button", { name: "继续" }).click();

  await page.getByRole("button", { name: "成长蜕变" }).click();
  await page.getByRole("button", { name: "继续" }).click();
  await page.getByRole("button", { name: "大众读者" }).click();
  await page.getByRole("button", { name: "继续" }).click();
  await page.getByRole("button", { name: "12 章" }).click();
  await page.getByRole("button", { name: "继续" }).click();
  await page.getByRole("button", { name: "确认配置" }).click();

  await expect(page.getByRole("heading", { name: "候选标题" })).toBeVisible();
  await page.getByRole("button", { name: "霓虹子午线" }).click();
  await page.getByRole("button", { name: "确认标题" }).click();

  await expect(page).toHaveURL(/\/qa\/task-019\/plan$/);
  await expect(page.getByText("故事结构")).toBeVisible();
  await page.getByRole("button", { name: "编辑大纲" }).first().click();
  await page
    .getByRole("textbox", { name: "章节大纲概要" })
    .fill(
      "章节定位: 开端 | 核心事件: 林夏重新解码灾难录音并定位广播塔 | 冲突升级: 备份再次被清除 | 章节悬念: 录音中出现内部代号",
    );
  await page.getByRole("button", { name: "保存大纲" }).click();
  await expect(page.getByText("保存成功。")).toBeVisible();

  await page.screenshot({
    path: testInfo.outputPath("task-019-planning.png"),
    fullPage: true,
  });
});
