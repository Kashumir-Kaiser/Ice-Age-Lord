import { expect, test } from '@playwright/test';

test('Stage 07 plays and reloads a timed H0 combat encounter through the browser', async ({ page }) => {
  test.setTimeout(45_000);
  const ownerKey = process.env.ILL_TEST_OWNER_KEY;
  expect(ownerKey, 'CI must provide the ephemeral API owner key').toBeTruthy();

  await page.goto('/?mode=live');
  await expect(page.getByRole('heading', { name: 'Kết nối game API' })).toBeVisible();
  await expect(page.getByText('API sẵn sàng · SQLite · phiên cục bộ')).toBeVisible();
  await page.getByLabel('Khóa chủ sở hữu').fill(ownerKey!);
  await page.getByRole('button', { name: 'Kết nối API' }).click();
  await expect(page.getByRole('heading', { name: 'Chọn hoặc tạo lượt lưu' })).toBeVisible();

  const slotName = 'Stage 07 combat ' + crypto.randomUUID();
  await page.getByLabel('Tên lượt lưu mới').fill(slotName);
  await page.getByRole('button', { name: 'Tạo lượt chơi sạch' }).click();
  await expect(page.getByText(/Clean game đã được tạo và commit/)).toBeVisible();

  const navigation = page.getByRole('navigation', { name: 'Màn hình game' });
  await navigation.getByRole('button', { name: /^Quân lực/ }).click();
  await page.getByRole('button', { name: 'Kiểm tra thi thể' }).click();
  await page.getByRole('button', { name: 'Tử Phục', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Rook' })).toBeVisible();
  await page.getByRole('button', { name: /Trang bị STAGE07-ASH-WOOD-SPEAR/ }).click();
  await page.getByRole('button', { name: /Trang bị STAGE07-FELT-CLOAK/ }).click();

  await navigation.getByRole('button', { name: /^Kho vật phẩm/ }).click();
  await expect(page.getByText(/STAGE07-ASH-WOOD-SPEAR/)).toBeVisible();
  await navigation.getByRole('button', { name: /^Bản đồ/ }).click();
  const target = page.getByTestId('map-combat-target');
  await expect(target).toBeVisible();
  await target.click();
  await expect(page.getByTestId('combat-target-inspector')).toBeVisible();

  await page.getByLabel('Điều kiện tự dừng').selectOption('next_completion');
  const engageButton = page.getByRole('button', { name: 'Engage target' });
  await expect(engageButton).toBeEnabled();
  await engageButton.click();
  await navigation.getByRole('button', { name: /^Quân lực/ }).click();
  const combatPanel = page.getByTestId('stage07-combat-panel');
  await expect(combatPanel).toContainText(/active/);
  await page.getByLabel('Tốc độ mô phỏng').selectOption('1x');
  await expect(combatPanel).toContainText(/active · vòng [1-9]/, { timeout: 8_000 });

  // Pause after the first settled round so reload proves the encounter state is durable mid-fight.
  await page.getByLabel('Tốc độ mô phỏng').selectOption('paused');
  await expect(combatPanel).toContainText(/active · vòng [1-9]/);
  await page.reload();
  await page.getByLabel('Khóa chủ sở hữu').fill(ownerKey!);
  await page.getByRole('button', { name: 'Kết nối API' }).click();
  await expect(page.getByText('Đã khôi phục đúng lượt lưu từ API.')).toBeVisible();
  await navigation.getByRole('button', { name: /^Quân lực/ }).click();
  const restoredCombatPanel = page.getByTestId('stage07-combat-panel');
  await expect(restoredCombatPanel).toContainText(/active · vòng [1-9]/);

  await page.getByLabel('Tốc độ mô phỏng').selectOption('5x');
  await expect(restoredCombatPanel).toContainText(/victory/, { timeout: 15_000 });
  await expect(restoredCombatPanel).toContainText('dead');
  await page.getByLabel('Tốc độ mô phỏng').selectOption('paused');
  const hareCorpse = page.getByTestId('force-corpse-row').last();
  await hareCorpse.getByRole('button', { name: 'Kiểm tra thi thể' }).click();
  await expect(hareCorpse).toContainText('Thỏ băng');
  await hareCorpse.getByRole('button', { name: 'Tử Phục', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Thỏ băng' })).toHaveCount(2);

  await navigation.getByRole('button', { name: /^Nhật ký/ }).click();
  await expect(page.getByText('Bắt đầu giao chiến')).toBeVisible();
  await expect(page.getByText(/Giao chiến kết thúc · nhặt được thi thể thật/)).toBeVisible();
});
