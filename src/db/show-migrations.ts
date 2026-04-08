import { appDataSource } from "./data-source.js";

async function run() {
  await appDataSource.initialize();
  try {
    const pending = await appDataSource.showMigrations();
    console.log(`Pending migrations: ${pending ? "yes" : "no"}`);
  } finally {
    await appDataSource.destroy();
  }
}

void run();
