const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace class names
content = content.replace(/glass-container/g, 'store-utility-card');
content = content.replace(/glass-card/g, 'store-utility-card');
content = content.replace(/glass-button-primary/g, 'button-primary');
content = content.replace(/glass-button-danger/g, 'button-dark-utility');
content = content.replace(/glass-button/g, 'button-secondary-pill');

// Remove some old inline styles that force colors
content = content.replace(/style={{ background: 'var\(--bg-card-subtle\)' }}/g, '');
content = content.replace(/style={{ background: 'var\(--bg-card\)' }}/g, '');
content = content.replace(/style={{ color: 'var\(--text-tertiary\)' }}/g, '');
content = content.replace(/style={{ color: 'var\(--text-secondary\)' }}/g, '');
content = content.replace(/style={{ borderTop: '1px solid var\(--border\)' }}/g, '');

// Typography changes
// text-xl font-bold -> typography-display-md
content = content.replace(/text-xl font-bold/g, 'typography-display-md');
// text-lg font-bold -> typography-body-strong
content = content.replace(/text-lg font-bold/g, 'typography-body-strong');
// text-sm text-\[var\(--text-secondary\)\] -> typography-caption text-[var(--color-body-muted)]
content = content.replace(/text-sm text-\[var\(--text-secondary\)\]/g, 'typography-caption text-[var(--color-body-muted)]');
content = content.replace(/text-xs/g, 'typography-caption');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Refactor complete.');
