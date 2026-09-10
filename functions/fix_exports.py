filepath = r"src/index.ts"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

import re

# Remove from paystack
content = re.sub(
    r"export \{ initializePaystackTransaction, verifyPaystackTransaction, paystackWebhook, paystackCallback \} from '\./paystack';",
    "export { initializePaystackTransaction, verifyPaystackTransaction, paystackWebhook } from './paystack';",
    content
)

# Add to chat
content = re.sub(
    r"export \{ onNewChatMessage \} from '\./chat';",
    "export { onNewChatMessage, paystackCallback } from './chat';",
    content
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated index exports")
