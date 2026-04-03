const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');
const oldUrl = 'generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
const newUrl = 'generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const count = (c.split(oldUrl).length - 1);
c = c.split(oldUrl).join(newUrl);
fs.writeFileSync('index.html', c, 'utf8');
console.log('Fixed', count, 'occurrences -> gemini-2.0-flash');
