import fs from 'node:fs';
import assert from 'node:assert/strict';
import Module from 'node:module';
import path from 'node:path';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const filename=path.resolve('app/site-navigation.tsx');
const mod=new Module(filename);mod.filename=filename;mod.paths=Module._nodeModulePaths(path.dirname(filename));
mod._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,filename);
const {primaryNavigation,resourceNavigation,allNavigation,PrimaryNavigation,ResourceNavigation,navigationView}=mod.exports;
assert.equal(primaryNavigation.length,4);
assert.equal(new Set(allNavigation.map(n=>n.href)).size,11);
for(const item of allNavigation){
 const route=item.href==='/'?'app/page.tsx':`app${item.href}/page.tsx`;
 assert.ok(fs.existsSync(route),`${item.href} route missing`);
 const html=renderToStaticMarkup(React.createElement(React.Fragment,null,React.createElement(PrimaryNavigation,{view:item.href}),React.createElement(ResourceNavigation,{view:item.href})));
 assert.equal((html.match(/aria-current="page"/g)||[]).length,1);
 assert.ok(html.includes(`href="${item.href}"`));
 if(resourceNavigation.includes(item))assert.match(html,/<details[^>]* open=""/);
}
assert.equal(navigationView('/jersey-city/wildlife'),'/jersey-city');
console.log('PASS: eleven real route links, four primary destinations, one selected item, active tools expanded, nested Jersey City selection');
