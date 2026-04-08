import { appDataSource } from "./data-source.js";

async function run() {
  await appDataSource.initialize();
  try {
    const migrations = await appDataSource.runMigrations();
    console.log(`Applied ${migrations.length} migration(s).`);
  } finally {
    await appDataSource.destroy();
  }
}

void run();
