import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'.',testMatch:'mobile-guide.spec.mjs',use:{baseURL:process.env.EARTHBOUND_TEST_URL||'http://localhost:4173',trace:'retain-on-failure'},projects:[{name:'narrow',use:{viewport:{width:360,height:800}}},{name:'phone',use:{viewport:{width:393,height:852}}},{name:'landscape',use:{viewport:{width:852,height:393}}}]});
