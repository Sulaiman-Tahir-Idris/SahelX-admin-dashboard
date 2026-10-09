const fs = require('fs');
let code = fs.readFileSync('components/staff/staff-page.tsx', 'utf8');
code = code.replace(/body: JSON\.stringify\(\{([\s\S]*?)\.\.\.formData,([\s\S]*?)baseSalary: Number\(formData\.baseSalary\)/, 'body: JSON.stringify({$1...formData, displayName: formData.name,$2baseSalary: Number(formData.baseSalary)');
fs.writeFileSync('components/staff/staff-page.tsx', code);
