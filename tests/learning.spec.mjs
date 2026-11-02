import {test,expect} from '@playwright/test';
test('detective retries, explains and transfers',async({page})=>{
 await page.goto('/learn/detective');
 await page.getByLabel('It is looking for food',{exact:true}).check();
 await expect(page.getByText('That’s an inference.')).toBeVisible();
 await page.getByLabel('A black cap on its head',{exact:true}).check();
 await expect(page.getByText('That’s an observation.')).toBeVisible();
 await page.screenshot({path:`reports/learning/detective-${test.info().project.name}.png`});
 await page.getByRole('button',{name:'Explain your evidence'}).click();
 await page.getByRole('textbox').fill('Dark feathers above the eye contrast with the pale face.');
 await page.getByRole('button',{name:'Try another image',exact:true}).click();
 await page.getByLabel('Parallel rails beneath the locomotive',{exact:true}).check();
 await page.getByRole('textbox').fill('I can point to the two metal rails below the train.');
 await page.getByRole('button',{name:'Finish and reflect'}).click();
 await expect(page.getByText('Challenge complete.',{exact:true})).toBeVisible();
});
test('rain compares fixed rainfall and imports a reflection',async({page})=>{
 await page.goto('/learn/rain');
 await page.getByLabel('Less runoff',{exact:true}).check();
 await page.getByLabel('What makes you think that?').fill('The planted soil may hold some water.');
 await page.screenshot({path:`reports/learning/rain-${test.info().project.name}.png`});
 await page.getByRole('button',{name:'Pavement',exact:true}).click();
 await page.getByRole('button',{name:'Run the experiment'}).click();
 await page.getByRole('button',{name:'Add a rain garden',exact:true}).click();
 await expect(page.getByText(/Conditions changed/)).toBeVisible();
 await page.getByRole('button',{name:'Run the experiment'}).click();
 await expect(page.getByText('With the same rainfall, the rain garden sends less runoff toward the drain.')).toBeVisible();
 await page.getByLabel('What changed? What evidence supports your explanation?').fill('The garden had moderate rather than high runoff in this model.');
 await page.getByRole('button',{name:'Save experiment to journal'}).click();
 await expect(page).toHaveURL(/learn\/journal/);
 await page.getByRole('button',{name:'Save observation',exact:true}).click();
 await expect(page.getByText('Observation saved on this device.')).toBeVisible();
});
test('journal draft, reload, edit, save and delete',async({page})=>{
 await page.goto('/learn/journal');
 await page.screenshot({path:`reports/learning/journal-${test.info().project.name}.png`});
 await page.getByLabel('I noticed…',{exact:false}).fill('A black cap');
 await page.reload();
 await expect(page.getByLabel('I noticed…',{exact:false})).toHaveValue('A black cap');
 await page.getByRole('button',{name:'Save observation',exact:true}).click();
 await page.getByRole('button',{name:'Reopen & edit'}).click();
 await page.getByRole('button',{name:'Reopen entry',exact:true}).click();
 await page.getByLabel('I noticed…',{exact:false}).fill('A black cap above the eye');
 await page.getByRole('button',{name:'Save observation',exact:true}).click();
 await page.getByRole('button',{name:'Delete',exact:true}).click();
 await page.getByRole('button',{name:'Delete observation',exact:true}).click();
 await expect(page.getByText('No saved observations yet.')).toBeVisible();
});
test('layers and selected park survive timeline navigation',async({page})=>{
 await page.goto('/jersey-city/map');
 await page.getByRole('button',{name:'Layers',exact:true}).click();
 await page.getByLabel('Waterfront',{exact:true}).click();
 await page.getByLabel('Map feature',{exact:true}).selectOption({label:'Liberty State Park'});
 await page.getByRole('button',{name:'Done',exact:true}).click();
 await page.screenshot({path:`reports/learning/map-${test.info().project.name}.png`});
 await page.getByRole('link',{name:'Explore the timeline →',exact:true}).click();
 await page.getByRole('button',{name:/Planned/}).click();
 await page.screenshot({path:`reports/learning/timeline-${test.info().project.name}.png`});
 await page.goBack();await page.goBack();
 await expect(page.getByRole('heading',{name:'Liberty State Park',exact:true})).toBeVisible();
});
test('no horizontal overflow at target width',async({page})=>{
 for(const route of ['/learn/detective','/learn/rain','/learn/journal','/jersey-city/map','/jersey-city/stories']){
  await page.goto(route);await expect(page.locator('main')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
});
