import { defineConfig } from "@playwright/test";

const port = 4175;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    browserName: "chromium",
    channel: "msedge",
    headless: true,
  },
  workers: 1,
  reporter: "list",
  // Serves the existing `npm run build` with an isolated environment: local
  // `.data/` store, no Atlas, no real email or Google, whatever `.env.local` holds.
  // (Next never overrides a variable that is already set, even to "".)
  webServer: {
    command: `npx next start --port ${port}`,
    url: `http://127.0.0.1:${port}/api/auth/me`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATA_SOURCE: "local",
      MONGODB_URI: "",
      GMAIL_USER: "",
      GMAIL_APP_PASSWORD: "",
      RESEND_API_KEY: "",
      GOOGLE_CLIENT_ID: "",
      GOOGLE_CLIENT_SECRET: "",
    },
  },
});
