const fs=require('node:fs'),{ESLint}=require('eslint'),globals=require('globals');
(async()=>{
const html=fs.readFileSync('index.html','utf8');
const source=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).join('\n');
const eslint=new ESLint({overrideConfigFile:true,overrideConfig:[{languageOptions:{ecmaVersion:'latest',sourceType:'script',globals:{...globals.browser,...Object.fromEntries([...html.matchAll(/window\.([A-Za-z_$][\w$]*)\s*=/g)].map(m=>[m[1],'writable']))}},rules:{'no-undef':'error','no-redeclare':'warn','no-unused-vars':'warn'}}]});
const results=await eslint.lintText(source,{filePath:'app.js'});
const formatter=await eslint.loadFormatter('stylish');console.log(formatter.format(results));
fs.writeFileSync('test-results/lint.json',JSON.stringify(results.map(r=>({errorCount:r.errorCount,warningCount:r.warningCount,messages:r.messages})),null,2));
process.exitCode=results.some(r=>r.errorCount)?1:0;
})();
