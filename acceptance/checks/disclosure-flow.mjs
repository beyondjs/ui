import { expect } from '../support/browser.mjs';

export const checks = [{
 name: 'disclosure flow: outside pointer completes its action, explicit close and menu dismissal',
 consumers: ['dom', 'react19', 'react18'],
 async run(browser, consumer) {
  for (const reducedMotion of ['no-preference', 'reduce']) {
   const { page } = await browser.open(consumer, { file: 'disclosure.html', viewport: { width: 800, height: 600 }, reducedMotion });
   const trigger = page.getByRole('button', { name: 'Development', exact: true });
   const panel = page.locator('#section .bui-disclosure-panel');
   const action = page.locator('#action');
   await trigger.click();
   await action.focus();
   const box = await action.boundingBox();
   const y = await page.evaluate(() => scrollY);
   await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
   await page.mouse.down();
   expect(await panel.isVisible(), 'outside pointerdown preserves the inline section');
   expect(await page.evaluate(() => scrollY) === y, 'pointerdown does not move the page');
   await page.mouse.up();
   expect(await page.locator('#root').getAttribute('data-opened') === 'true', 'real pointer sequence completes the branch action');
   expect(await action.evaluate(node => node === document.activeElement || document.activeElement === document.body), 'outside action does not redirect focus into the disclosure');
   await page.getByRole('textbox', { name: 'Command' }).focus();
   await page.keyboard.press('Escape');
   expect(!await panel.isVisible(), 'Escape closes the section');
   expect(await trigger.evaluate(node => node === document.activeElement), 'Escape returns focus');
   await trigger.click(); await trigger.click();
   expect(!await panel.isVisible(), 'the button closes the section');
   await page.getByRole('button', { name: 'Menu', exact: true }).click();
   await action.click();
   expect(await page.getByRole('button', { name: 'Menu', exact: true }).getAttribute('aria-expanded') === 'false', 'default outside dismissal remains');
   const help = page.getByRole('button', { name: 'Help: Command', exact: true });
   await help.click();
   await action.click();
   expect(await page.locator('.bui-help-panel').isVisible(), 'inline help remains open across another action');
   await help.focus(); await page.keyboard.press('Escape');
   expect(!await page.locator('.bui-help-panel').isVisible(), 'help still closes with Escape');
  }
 }
}];
