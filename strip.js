const fs = require('fs');
let code = fs.readFileSync('functions/src/notifications.ts', 'utf8');
code = code.replace(/export const onDeliveryCreated =[\s\S]*$/, '');
fs.writeFileSync('functions/src/notifications.ts', code);
