filepath = r"src/paystack.ts"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

import re

# Remove paystackCallback from paystack.ts (v2)
content = re.sub(
    r"export const paystackCallback = onRequest\(async \(req, res\) => \{[\s\S]*?\}\);\n",
    "",
    content
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Removed paystackCallback from v2")
