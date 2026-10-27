import { expect, test } from "@playwright/test";
import { demoAccounts } from "../../lib/demo-accounts";

for (const account of demoAccounts) {
  for (const method of ["role", "email"] as const) {
    test(`${account.role}: login lewat ${method}, sesi, menu, dan logout`, async ({ page }) => {
      await page.goto("/login");
      if (method === "role") {
        await page.getByRole("tab", { name: account.role, exact: true }).click();
        await page.getByRole("button", { name: `Masuk sebagai ${account.role}`, exact: true }).click();
      } else {
        await page.getByLabel("Email", { exact: true }).fill(account.email);
        await page.getByLabel("Password", { exact: true }).fill(account.password);
        await page.getByRole("button", { name: "Masuk", exact: true }).click();
      }

      await expect(page).toHaveURL(/\/dashboard$/);
      await expect(page.getByRole("heading", { name: "Selamat datang di Farm Tech" })).toBeVisible();
      await expect(page.getByText("Dashboard gagal dimuat.", { exact: false })).toHaveCount(0);
      await page.reload();
      await expect(page.getByRole("heading", { name: "Selamat datang di Farm Tech" })).toBeVisible();

      await expect(page.getByRole("link", { name: "Pengguna", exact: true })).toHaveCount(account.role === "Administrator" ? 1 : 0);
      await expect(page.getByRole("link", { name: "Transaksi keuangan", exact: true })).toHaveCount(account.role === "ABK" ? 0 : 1);
      await page.getByRole("link", { name: "Stok pakan", exact: true }).click();
      await expect(page.getByRole("heading", { name: "Stok pakan", exact: true })).toBeVisible();
      await expect(page.getByRole("cell", { name: "Pakan Layer", exact: true })).toBeVisible();

      await page.getByRole("button", { name: "Keluar", exact: true }).filter({ visible: true }).click();
      await expect(page).toHaveURL(/\/login$/);
      await page.goto("/dashboard");
      await expect(page).toHaveURL(/\/login$/);
    });
  }
}
