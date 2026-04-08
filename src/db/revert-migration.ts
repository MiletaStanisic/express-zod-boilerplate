import { appDataSource } from "./data-source.js";

async function run() {
  await appDataSource.initialize();
  try {
    await appDataSource.undoLastMigration();
    console.log("Reverted last migration.");
  } finally {
    await appDataSource.destroy();
  }
}

void run();
