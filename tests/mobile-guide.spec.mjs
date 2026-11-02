import {test,expect} from '@playwright/test';
test('A: hotspot to tortoise exhibit and return',async({page})=>{
 await page.goto('/?intro=0&hotspot=north-american-coastal-plain');
 const panel=page.getByRole('region',{name:'Selected hotspot'});
 await panel.getByRole('button',{name:/Read habitat, species/}).click();
 await expect(panel.getByRole('button',{name:/Collapse details/})).toHaveAttribute('aria-expanded','true');
 await panel.getByRole('link',{name:/Open 3D exhibit/}).first().click();
 const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();
 await expect(dialog).toContainText('Gopher');
 await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();
 await expect(panel).toBeVisible();
 await panel.getByRole('button',{name:'Collapse hotspot details',exact:true}).click();
 await expect(panel.locator('#mobile-detail-content')).toBeHidden();
});
test('B: choose setting and plant, place, read warning and move',async({page})=>{
 await page.goto('/plant-lab');
 await page.getByLabel('Jersey City setting').selectOption('schoolyard-strip');
 await page.locator('.plant-entry').filter({hasText:'Switchgrass'}).click();
 await page.getByRole('button',{name:/Row 1, column 1: empty/}).click();
 const feedback=page.locator('.selected-bed-feedback');await expect(feedback).toContainText('Switchgrass');
 await expect(feedback).toContainText('Check this placement');
 await feedback.getByRole('button',{name:'Move selected plant'}).click();
 await page.getByRole('button',{name:/Row 4, column 4: empty/}).click();
 await expect(feedback).toContainText('Row 4, column 4');
 await page.getByRole('button',{name:'Save design',exact:true}).click();
 await expect(page.getByText('Ready for teacher review',{exact:true})).toBeVisible();
 await page.reload();await expect(page.getByRole('button',{name:/Row 4, column 4: Switchgrass/})).toBeVisible();
});
