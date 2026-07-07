const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace class names back to Tailwind / Shadcn standards
content = content.replace(/store-utility-card/g, 'bg-card text-card-foreground border rounded-xl shadow-sm');
content = content.replace(/button-primary/g, 'bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2');
content = content.replace(/button-dark-utility/g, 'bg-destructive text-destructive-foreground hover:bg-destructive/90 px-4 py-2');
content = content.replace(/button-secondary-pill/g, 'bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2');

// Typography changes
content = content.replace(/typography-display-md/g, 'text-2xl font-bold tracking-tight');
content = content.replace(/typography-body-strong/g, 'text-lg font-semibold');
content = content.replace(/typography-caption text-\[var\(--color-body-muted\)\]/g, 'text-sm text-muted-foreground');
content = content.replace(/typography-caption/g, 'text-sm');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Refactor to Shadcn complete.');
