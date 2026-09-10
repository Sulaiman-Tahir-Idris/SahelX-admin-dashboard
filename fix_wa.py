filepath = r"components/deliveries/deliveries-table.tsx"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

import re

old_msg = r"const msg = `\uD83D\uDE9A \*SahelX Logistics & Deliveries\*\n\uD83D\uDCE6 Delivery Update\n\n\*Tracking ID:\* \${d\.trackingId}\n\*Status:\* \${statusData\.label} \${statusData\.emoji}\n\n\uD83D\uDCCD \*Pickup:\* \${d\.pickupLocation\?\.address \|\| 'N/A'}\n\uD83C\uDFC1 \*Drop-off:\* \${d\.dropoffLocation\?\.address \|\| 'N/A'}\n\n\uD83D\uDCB0 \*Delivery Fee:\* NGN \${d\.cost \|\| 0} — \${d\.paymentStatus === 'paid' \? 'Paid \u2705' : 'Payment Pending \u23F3'}\n\n\uD83D\uDD17 \*Track your package:\*\nhttps://sahelx\.com\.ng/tracking\?id=\${d\.trackingId}\n\n\uD83D\uDCDE Support: info@sahelx\.com\.ng \| \+234 907 777 7880`;"

new_msg = "const msg = `*SahelX Logistics & Deliveries*\\nDelivery Update\\n\\n*Tracking ID:* ${d.trackingId}\\n*Status:* ${statusData.label}\\n\\n*Pickup:* ${d.pickupLocation?.address || 'N/A'}\\n*Drop-off:* ${d.dropoffLocation?.address || 'N/A'}\\n\\n*Delivery Fee:* NGN ${d.cost || 0} - ${d.paymentStatus === 'paid' ? 'Paid' : 'Payment Pending'}\\n\\n*Track your package:*\\nhttps://sahelx.com.ng/tracking?id=${d.trackingId}\\n\\nSupport: info@sahelx.com.ng | +234 907 777 7880`;"

new_content = re.sub(old_msg, new_msg, content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(new_content)
print("Replaced successfully" if old_msg != new_msg else "Same msg")
