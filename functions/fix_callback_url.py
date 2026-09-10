filepath = r"src/paystack.ts"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

import re
content = re.sub(
    r"channels: \['card', 'bank', 'ussd', 'bank_transfer'\],",
    "channels: ['card', 'bank', 'ussd', 'bank_transfer'],\n        callback_url: 'https://us-central1-sahelx-backend.cloudfunctions.net/paystackCallback',",
    content
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Added callback_url")
