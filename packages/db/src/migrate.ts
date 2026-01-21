import { fileURLToPath } from "url";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db } from "./client";

const __filename = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1]?.endsWith("migrate.ts") || process.argv[1] === __filename;

/**
 * 데이터베이스 마이그레이션 실행
 */
export async function runMigrations() {
  try {
    console.log("🔄 Running database migrations...");
    
    await migrate(db, { 
      migrationsFolder: "./packages/db/migrations" 
    });
    
    console.log("✅ Database migrations completed successfully");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

/**
 * 개발용 데이터베이스 시딩
 */
export async function seedDatabase() {
  try {
    console.log("🌱 Seeding database with sample data...");
    
    // 여기에 개발용 샘플 데이터 삽입 로직 추가
    // 현재는 실제 GitHub 연동을 통해 데이터를 가져오므로 시딩은 선택적
    
    console.log("✅ Database seeding completed");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  }
}

// CLI에서 직접 실행할 수 있도록 (ESM 호환)
if (isMainModule) {
  const command = process.argv[2];
  
  if (command === "migrate") {
    runMigrations()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else if (command === "seed") {
    seedDatabase()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else {
    console.log("Usage: tsx migrate.ts [migrate|seed]");
    process.exit(1);
  }
}