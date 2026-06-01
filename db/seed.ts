import { db } from "./index";
import { users, userPreferences } from "./schema";
import bcrypt from "bcryptjs";

async function seed() {
  // 创建测试账号
  const adminUser = await db
    .insert(users)
    .values({
      email: "admin@novelist.local",
      name: "管理员",
      passwordHash: await bcrypt.hash("Admin123!", 10),
      emailVerified: new Date(),
    })
    .returning();

  const normalUser = await db
    .insert(users)
    .values({
      email: "user@novelist.local",
      name: "普通用户",
      passwordHash: await bcrypt.hash("User123!", 10),
      emailVerified: new Date(),
    })
    .returning();

  // 创建预置偏好数据
  await db.insert(userPreferences).values([
    {
      userId: adminUser[0].id,
      preferences: {
        preferredGenres: ["悬念", "科幻", "历史"],
        defaultTone: "严肃",
        defaultChapterCount: 30,
      },
    },
    {
      userId: normalUser[0].id,
      preferences: {
        preferredGenres: ["科幻", "奇幻", "都市"],
        defaultTone: null,
        defaultChapterCount: null,
      },
    },
  ]);

  console.log("✅ 种子数据填充完成");
}

seed()
  .catch(console.error)
  .finally(() => process.exit());
