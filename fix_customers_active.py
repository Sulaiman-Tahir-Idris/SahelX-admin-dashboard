import os

filepath = r"lib/firebase/customers.ts"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the totalOrders isActive logic
old_logic = "isActive: (totalOrders || 0) >= 2,"
new_logic = """
          // Calculate 30-day recency for active status
          const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
          const now = Date.now();
          let isActive = false;
          
          if (lastOrder) {
            const lastOrderTime = lastOrder?.seconds ? lastOrder.seconds * 1000 : new Date(lastOrder).getTime();
            isActive = (now - lastOrderTime) <= THIRTY_DAYS_MS;
          }

          return {
            ...customer,
            totalOrders,
            lastOrder,
            isActive,
""".strip()

content = content.replace(
    "return {\n            ...customer,\n            totalOrders,\n            lastOrder,\n            isActive: (totalOrders || 0) >= 2,\n          } as Customer;",
    new_logic + "\n          } as Customer;"
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
