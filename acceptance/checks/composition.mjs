import { expect, overflow } from '../support/browser.mjs';

/** Installed DOM and React surfaces share containment without changing the meaning of a notice. */
export const checks = [{
 name: 'common composition: contained objects and message evidence across widths and themes',
 consumers: ['dom', 'react19', 'react18'],
 async run(browser, consumer) {
  for (const width of [320, 390, 960, 1920]) for (const colorScheme of ['light', 'dark']) {
   const { page, context, errors } = await browser.open(consumer, { file: 'composition.html', viewport: { width, height: 1000 }, colorScheme, hasTouch: width < 400 });
   await page.locator('.bui-collection-rows .bui-row').first().waitFor();
   await page.evaluate(() => document.fonts.ready);
   const shape = await page.evaluate(() => {
    const notice = document.querySelector('#notice.bui-callout, #notice .bui-callout');
    const box = notice.getBoundingClientRect();
    const text = notice.querySelector('.bui-callout-text').getBoundingClientRect();
    const detail = notice.querySelector('.bui-details').getBoundingClientRect();
    const body = notice.querySelector('.bui-callout-body').getBoundingClientRect();
    const list = document.querySelector('#objects');
    const row = list.querySelector('.bui-row');
    const name = row.querySelector('.bui-row-title');
    const mark = row.querySelector('.bui-organization-mark').getBoundingClientRect();
    const outer = row.getBoundingClientRect();
    const lead = row.querySelector('.bui-row-lead').getBoundingClientRect();
    return { mark: [mark.width, mark.height], room: [mark.top - outer.top, outer.bottom - mark.bottom], lead: lead.height, box: box.width, text: text.width, inset: box.width - body.width, aligned: Math.abs(detail.right - body.right) < 1, contained: body.right <= box.right && detail.left >= body.left, frame: getComputedStyle(list).borderTopWidth, weight: getComputedStyle(name).fontWeight, inline: row.hasAttribute('data-inline'), grouped: [...document.querySelectorAll('.bui-collection-rows .bui-rows')].every(node => node.hasAttribute('data-framed')) };
   });
   expect(shape.aligned && shape.contained, `${width}: details stay inside the notice's text column: ${JSON.stringify(shape)}`);
   expect(shape.box <= shape.text + shape.inset + 1, 'no unrelated empty width beyond the reading column');
   expect(shape.mark.every(value => Math.abs(value - 40) < 1), 'organization identity has the same forty-pixel mark in every adapter');
   expect(shape.lead >= 40 && shape.room.every(value => value >= 15), `inline metadata preserves the mark and its row insets: ${JSON.stringify(shape)}`);
   expect(shape.frame === '1px' && shape.weight === '600' && shape.inline && shape.grouped, 'one framed list with name hierarchy, inline role and framed groups');
   const stacked = await page.locator('#stacked .bui-row').evaluate(row => {
    const outer = row.getBoundingClientRect();
    const mark = row.querySelector('.bui-organization-mark').getBoundingClientRect();
    const lead = row.querySelector('.bui-row-lead').getBoundingClientRect();
    return { height: mark.height, lead: lead.height, top: mark.top - outer.top, bottom: outer.bottom - mark.bottom };
   });
   expect(stacked.height === 40 && stacked.lead >= 40 && stacked.top >= 15 && stacked.bottom >= 15, `stacked metadata also contains its large mark: ${JSON.stringify(stacked)}`);
   const wrappers = await page.locator('#wrapped .bui-row').evaluateAll(rows => rows.map(row => ({ divider: getComputedStyle(row, '::before').content, top: parseFloat(getComputedStyle(row).borderTopLeftRadius), bottom: parseFloat(getComputedStyle(row).borderBottomLeftRadius) })));
   expect(wrappers[0].divider === 'none' && wrappers[1].divider !== 'none', `wrapped rows keep only the internal divider: ${JSON.stringify(wrappers)}`);
   expect(wrappers[0].top > 0 && wrappers[1].bottom > 0, 'wrapped end rows follow the frame corners');
   expect(!(await overflow(page)), `${width}/${colorScheme}: no horizontal overflow`);
   await page.locator('#notice .bui-summary').click();
   expect(await page.locator('#notice .bui-details').getAttribute('open') !== null, 'evidence opens in place');
   const title = page.locator('#objects .bui-row-title').first();
   await title.focus();await title.press('Enter');
   expect((await page.url()).endsWith('#studio'), 'object navigation remains a real link');
   await page.locator('#objects .bui-menu-button').first().click();
   await page.getByRole('menuitem', {name: 'Settings', exact:true}).click();
   expect(await page.evaluate(() => window.fixture.menu) === 1, 'row action does not open the row');
   await page.getByRole('button', {name:'Check the current machine state',exact:true}).click();
   expect(await page.evaluate(() => window.fixture.reads) === 1, 'only the explicit observation action ran');
   expect(errors.length === 0, errors.join('\n'));
   await context.close();
  }
 }
}];
