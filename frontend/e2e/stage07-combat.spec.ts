import { expect, test, type Locator, type Page } from '@playwright/test';

async function tapVisualCenter(page: Page, locator: Locator, mobile: boolean) {
  if (!mobile) {
    await locator.click();
    return;
  }
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const geometry = await locator.evaluate(element => {
      const rect = element.getBoundingClientRect();
      const viewport = window.visualViewport;
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        offsetLeft: viewport?.offsetLeft ?? 0,
        offsetTop: viewport?.offsetTop ?? 0,
        width: viewport?.width ?? window.innerWidth,
        height: viewport?.height ?? window.innerHeight,
      };
    });
    const x = geometry.x - geometry.offsetLeft;
    const y = geometry.y - geometry.offsetTop;
    if (x >= 0 && x <= geometry.width && y >= 0 && y <= geometry.height) {
      await page.touchscreen.tap(x, y);
      return;
    }
    await page.evaluate(({ deltaX, deltaY }) => window.scrollBy(deltaX, deltaY), {
      deltaX: x - geometry.width / 2,
      deltaY: y - geometry.height / 2,
    });
  }
  const lastPosition = await locator.evaluate(element => {
    const rect = element.getBoundingClientRect();
    const viewport = window.visualViewport;
    return {
      rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      scrollY: window.scrollY,
      visualViewport: viewport && {
        offsetTop: viewport.offsetTop,
        offsetLeft: viewport.offsetLeft,
        width: viewport.width,
        height: viewport.height,
      },
    };
  });
  throw new Error(`Unable to bring the element into the mobile visual viewport: ${JSON.stringify(lastPosition)}`);
}

test('Stage 07 plays and reloads a timed H0 combat encounter through the browser', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const ownerKey = process.env.ILL_TEST_OWNER_KEY;
  expect(ownerKey, 'CI must provide the ephemeral API owner key').toBeTruthy();

  await page.goto('/?mode=live');
  await expect(page.getByRole('heading', { name: 'Kết nối trò chơi' })).toBeVisible();
  await expect(page.getByText('Trò chơi đã sẵn sàng')).toBeVisible();
  await page.getByLabel('Khóa chủ sở hữu').fill(ownerKey!);
  await page.getByRole('button', { name: 'Kết nối API' }).click();
  await expect(page.getByRole('heading', { name: 'Chọn hoặc tạo lượt lưu' })).toBeVisible();

  const slotName = 'Stage 07 combat ' + crypto.randomUUID();
  await page.getByLabel('Tên lượt lưu mới').fill(slotName);
  await page.getByRole('button', { name: 'Bắt đầu lượt chơi' }).click();
  await expect(page.getByText(/Đã tạo cuộc phiêu lưu mới/)).toBeVisible();

  const navigation = page.getByRole('navigation', { name: 'Màn hình game' });
  await navigation.getByRole('button', { name: /^Quân lực/ }).click();
  await page.getByRole('button', { name: 'Kiểm tra thi thể' }).click();
  await page.getByRole('button', { name: 'Tử Phục', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Rook' })).toBeVisible();
  await page.getByRole('button', { name: /Trang bị Giáo gỗ tần bì/ }).click();
  await page.getByRole('button', { name: /Trang bị Áo choàng nỉ/ }).click();

  await navigation.getByRole('button', { name: /^Kho vật phẩm/ }).click();
  await expect(page.getByText(/Giáo gỗ tần bì/)).toBeVisible();
  await navigation.getByRole('button', { name: /^Bản đồ/ }).click();
  const target = page.getByTestId('map-combat-target');
  await expect(target).toBeVisible();
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    window.scrollTo(0, 0);
  });
  await target.scrollIntoViewIfNeeded();
  await tapVisualCenter(page, target, testInfo.project.name === 'mobile-chromium');
  await expect(page.getByTestId('combat-target-inspector')).toBeVisible();

  await page.getByLabel('Điều kiện tự dừng').selectOption('next_completion');
  const combatInspector = page.getByTestId('combat-target-inspector');
  await combatInspector.getByLabel('Chiến binh').selectOption({ label: 'Rook' });
  const engageButton = combatInspector.getByRole('button', { name: 'Tấn công' });
  await expect(engageButton).toBeEnabled();
  await tapVisualCenter(page, engageButton, testInfo.project.name === 'mobile-chromium');
  await navigation.getByRole('button', { name: /^Quân lực/ }).click();
  const combatPanel = page.getByTestId('stage07-combat-panel');
  await expect(combatPanel).toContainText(/Đang hoạt động/);
  await page.getByLabel('Tốc độ mô phỏng').selectOption('1x');
  await expect(combatPanel).toContainText(/Đang hoạt động · vòng [1-9]/, { timeout: 20_000 });

  // Pause after the first settled round so reload proves the encounter state is durable mid-fight.
  await page.getByLabel('Tốc độ mô phỏng').selectOption('paused');
  await expect(combatPanel).toContainText(/Đang hoạt động · vòng [1-9]/);
  await page.reload();
  await page.getByLabel('Khóa chủ sở hữu').fill(ownerKey!);
  await page.getByRole('button', { name: 'Kết nối API' }).click();
  await expect(page.getByText('Đã mở lượt lưu trước đó.')).toBeVisible();
  await navigation.getByRole('button', { name: /^Quân lực/ }).click();
  const restoredCombatPanel = page.getByTestId('stage07-combat-panel');
  await expect(restoredCombatPanel).toContainText(/Đang hoạt động · vòng [1-9]/);

  await page.getByLabel('Tốc độ mô phỏng').selectOption('5x');
  await expect(restoredCombatPanel).toContainText(/victory/, { timeout: 15_000 });
  await expect(restoredCombatPanel).toContainText('Đã chết');
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
