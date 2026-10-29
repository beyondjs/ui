import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, overflow } from '../support/browser.mjs';

/** Global navigation, its independent contextual panel and transient mobile drawer. */
export const checks = [{
 name: 'global navigation: preference, selection, object context, focus and mobile continuity in both themes',
 consumers: ['dom', 'react19', 'react18'],
 async run(browser, consumer) {
  for (const kind of ['inline', 'context']) for (const theme of ['dark', 'light']) {
   const { page, context } = await browser.open(consumer, { file: 'navigation.html', query: `?global=${kind}`, viewport: { width: 1440, height: 900 }, colorScheme: theme, reducedMotion: 'reduce' });
   const host = page.locator('.bui-sidebar');
   const toggle = page.locator('.bui-sidebar-global-toggle');
   await page.evaluate(() => document.fonts.ready);
   expect(await toggle.isVisible(), 'global hamburger is visible');
   expect(await page.getByRole('navigation', { name: consumer.language === 'es' ? 'Secciones de Conduict' : 'Conduict sections', exact: true }).count() === 1, 'one named global navigation when expanded');
   expect(await toggle.getAttribute('aria-expanded') === 'true', 'first visit expanded');
   const expanded = await host.boundingBox();
   if (process.env.BEYOND_UI_SIDEBAR_SHOTS) { mkdirSync(process.env.BEYOND_UI_SIDEBAR_SHOTS, { recursive: true }); await page.screenshot({ path: join(process.env.BEYOND_UI_SIDEBAR_SHOTS, `${consumer.name}-${kind}-${theme}-expanded.png`) }); }
   const panel = page.locator('.bui-sidebar-panel');
   expect(await panel.isVisible(), 'object context is available expanded');
   expect(Math.abs((await panel.boundingBox()).y + (await panel.boundingBox()).height - 900) < 1, 'expanded pane reaches the viewport bottom');
   await toggle.focus(); await page.keyboard.press('Enter');
   expect(await toggle.getAttribute('aria-expanded') === 'false', 'keyboard collapses only global navigation');
   expect(await toggle.evaluate(node => node === document.activeElement), 'focus stays on hamburger');
   const collapsed = await host.boundingBox();
   if (process.env.BEYOND_UI_SIDEBAR_SHOTS) await page.screenshot({ path: join(process.env.BEYOND_UI_SIDEBAR_SHOTS, `${consumer.name}-${kind}-${theme}-collapsed.png`) });
   expect(await page.getByRole('navigation', { name: consumer.language === 'es' ? 'Secciones de Conduict' : 'Conduict sections', exact: true }).count() === 1, 'one named global navigation when collapsed');
   expect(collapsed.width < expanded.width, 'global collapse releases page space');
   expect(await panel.isVisible() === (kind === 'context'), 'context visibility is independent; inline objects stay accessible by expansion');
   const current = page.locator('.bui-sidebar-rail [data-label="Repositories"]');
   expect(await current.getAttribute('aria-current') === 'page', 'selection survives collapse');
   await page.locator('.bui-sidebar-rail [data-label="Settings"]').hover();
   expect(await current.getAttribute('aria-current') === 'page', 'hover does not change selection');
   await current.focus();
   expect(await page.locator('.bui-hint:visible').count() === 1, 'collapsed focus exposes a named hint');
   await page.evaluate(() => window.fixture.update());
   expect(await current.evaluate(node => node === document.activeElement), 'live group update retains focus');
   await page.reload(); await page.waitForFunction(() => window.fixture?.ready);
   expect(await toggle.getAttribute('aria-expanded') === 'false', 'reload restores desktop choice');
   for (const width of [1024, 1023, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForFunction(width => document.querySelector('.bui-sidebar').dataset.mode === (width < 1024 ? 'drawer' : 'permanent'), width);
    expect(!(await overflow(page)), `${kind} ${theme} ${width}: no horizontal overflow`);
    if (width >= 1024) { await current.focus(); continue; }
    const trigger = page.locator('.bui-family .bui-header-toggle');
    expect(await trigger.isVisible(), 'one merged mobile navigation button');
    if (width === 1023) expect(await trigger.evaluate(node => node === document.activeElement), 'rail focus transfers before its presentation hides');
    await trigger.click();
    const dialog = page.locator('.bui-sidebar dialog');
    expect(await dialog.evaluate(node => node.open && node.contains(document.activeElement)), 'drawer opens with focus inside');
    for (let index = 0; index < 16; index++) { await page.keyboard.press('Tab'); expect(await dialog.evaluate(node => node.contains(document.activeElement)), 'Tab remains in drawer'); }
    await page.keyboard.press('Escape');
    expect(await trigger.evaluate(node => node === document.activeElement), 'cancel returns focus to merged trigger');
    expect(await page.evaluate(() => localStorage.getItem('bui-sidebar-navigation:v1:fixture')) === 'collapsed', 'mobile visibility never writes desktop preference');
   }
   await page.setViewportSize({ width: 1440, height: 900 });
   await page.waitForFunction(() => document.querySelector('.bui-sidebar').dataset.mode === 'permanent');
   expect(await toggle.getAttribute('aria-expanded') === 'false', 'return to desktop preserves collapse');
   await toggle.click(); expect(await toggle.getAttribute('aria-expanded') === 'true', 'desktop expands again');
   if (kind === 'inline') {
    await toggle.click();
    const object = page.locator('.bui-sidebar-rail button[data-object]');
    await object.click();
    expect(await panel.locator('.bui-sidebar-object').evaluate(node => node.contains(document.activeElement)), 'object expansion moves focus to its visible content');
    expect(await panel.locator('.bui-sidebar-collapse').count() === 0, 'inline objects have no unrelated contextual close');
   }
   expect(!(await overflow(page)), 'expanded composition fits');
   await panel.locator('a').first().focus();
   await page.setViewportSize({ width: 390, height: 900 });
   await page.waitForFunction(() => document.querySelector('.bui-sidebar').dataset.mode === 'drawer');
   expect(await page.locator('.bui-family .bui-header-toggle').evaluate(node => node === document.activeElement), 'expanded focus transfers to the mobile trigger');
   await page.locator('.bui-family .bui-header-toggle').click();
   await page.locator('.bui-drawer a[href="/settings"]').click();
   expect(await page.locator('.bui-sidebar dialog').evaluate(node => !node.open), 'navigation closes drawer');
   expect(await page.locator('main h1').evaluate(node => node === document.activeElement), 'product destination owns focus after navigation');
   await context.close();
  }
 }
}];
