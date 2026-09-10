import os

filepath = r"components/customers/customer-profile.tsx"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

calc_logic = """
  const avgRating =
    deliveries
      .filter((d) => d.rating > 0)
      .reduce((s, d) => s + (d.rating || 0), 0) /
    (deliveries.filter((d) => d.rating > 0).length || 1);
  const lastOrder = deliveries[0]?.createdAt || customer.lastOrder || null;

  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  let isCustomerActive = false;
  if (lastOrder) {
    const lastOrderTime = lastOrder?.seconds ? lastOrder.seconds * 1000 : new Date(lastOrder).getTime();
    isCustomerActive = (now - lastOrderTime) <= THIRTY_DAYS_MS;
  }
"""

content = content.replace(
"""
  const avgRating =
    deliveries
      .filter((d) => d.rating > 0)
      .reduce((s, d) => s + (d.rating || 0), 0) /
    (deliveries.filter((d) => d.rating > 0).length || 1);
  const lastOrder = deliveries[0]?.createdAt || customer.lastOrder || null;
""", calc_logic)

content = content.replace('variant={customer.isActive ? "default" : "secondary"}', 'variant={isCustomerActive ? "default" : "secondary"}')
content = content.replace('{customer.isActive ? "Active" : "Inactive"}', '{isCustomerActive ? "Active" : "Inactive"}')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
