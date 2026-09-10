filepath = r"src/index.ts"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

import re
content = re.sub(
    r"export \{ initializePaystackTransaction, verifyPaystackTransaction, paystackWebhook \} from '\./paystack';",
    "export { initializePaystackTransaction, verifyPaystackTransaction, paystackWebhook, paystackCallback } from './paystack';",
    content
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Exported paystackCallback")
