import os

filepath = r"components/customers/customer-profile.tsx"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix role check
content = content.replace(
    'if (role !== "admin") return;',
    'if (!["ceo", "cto", "cfo", "coo"].includes(role)) return;'
)
content = content.replace(
    '{role === "admin" && (',
    '{["ceo", "cto", "cfo", "coo"].includes(role) && ('
)

# 2. Fix profileImage -> profilePhoto
content = content.replace('customer.profileImage', 'customer.profilePhoto')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
