import os
import re

filepath = r"components/customers/customer-profile.tsx"
with open(filepath, 'rb') as f:
    raw = f.read()

# Decode ignoring errors
text = raw.decode('utf-8', errors='ignore')

# Replace the corrupted characters with safe react escape sequences
text = text.replace('— ₦', '{"\\u2014"} {"\\u20A6"}')
text = text.replace('₦', '{"\\u20A6"}')
text = text.replace('—', '{"\\u2014"}')
text = text.replace('?', '{"\\u2014"} {"\\u20A6"}') # in case of powershell replacement corruption
text = text.replace('', '') # remove any remaining replacement chars

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(text)
