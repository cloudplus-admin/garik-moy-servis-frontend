import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  use: { baseURL: process.env.PW_BASE_URL??"http://127.0.0.1:48002", trace: "retain-on-failure" },
  webServer: process.env.PW_BASE_URL?undefined:{ command: "pnpm start --hostname 127.0.0.1 --port 48002", url: "http://127.0.0.1:48002", reuseExistingServer: false },
});
