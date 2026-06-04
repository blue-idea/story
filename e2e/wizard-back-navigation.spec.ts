import { expect, test } from "@playwright/test";

test.setTimeout(120_000);

test("REQ-002-AC-002d: 向导支持后退回到刚刚访问的步骤并重新选择", async ({
  page,
}, testInfo) => {
  await page.goto("/qa/task-014");

  await page.getByRole("button", { name: /科幻未来/ }).click();
  await page.getByRole("button", { name: "继续" }).click();
  await page.getByRole("button", { name: /男性主角/ }).click();
  await page.getByRole("button", { name: "继续" }).click();
  await page.getByPlaceholder("自由输入职业或身份").fill("Engineer");
  await page.getByRole("button", { name: "继续" }).click();
  await page.getByRole("button", { name: /成长逆袭/ }).click();
  await page.getByRole("button", { name: "继续" }).click();
  await page.getByRole("button", { name: "继续" }).click();
  await page.getByRole("button", { name: /查明真相/ }).click();
  await page.getByRole("button", { name: "继续" }).click();
  await page.getByRole("button", { name: /责任\/使命/ }).click();
  await page.getByRole("button", { name: "完成第一层" }).click();
  await page.getByRole("button", { name: "进入第二层" }).click();

  await expect(page.getByText("Q4. 故事发生在什么样的世界？")).toBeVisible();

  await page.getByRole("button", { name: /现实世界/ }).click();
  await page.getByRole("button", { name: "继续" }).click();
  await page
    .getByPlaceholder("简单描述规则、设定要素或留空")
    .fill("Broadcast stations still control cross-city communication.");

  await page.getByRole("button", { name: "直接进 Q8" }).click();
  await expect(page.getByText("Q8A. 你计划创作多少章？")).toBeVisible();

  await page.getByRole("button", { name: "Back" }).click();
  await expect(
    page.getByText("Q4 追问：这个世界有什么独特的规则或设定要素？"),
  ).toBeVisible();

  await page.screenshot({
    path: testInfo.outputPath("task-022-wizard-back.png"),
    fullPage: true,
  });
});
