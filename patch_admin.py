import re

with open('components/deliveries/deliveries-table.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("const untagged = data.filter((d) => !d.tag);", "const untagged = data.filter((d) => !d.tag && !d.isBulk);")

with open('components/deliveries/deliveries-table.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

with open('components/multiple-deliveries/multiple-deliveries-table.tsx', 'r', encoding='utf-8') as f:
    content2 = f.read()

replacement2 = '''        const tagged = data.filter((d) => d.tag || d.isBulk);
        const grouped: Record<string, Delivery[]> = {};
        tagged.forEach((d) => {
          const tag = d.tag || (d.trackingId ? BULK_ : "untagged");
          if (!grouped[tag]) grouped[tag] = [];
          grouped[tag].push(d);
        });'''

old2 = '''        const tagged = data.filter((d) => d.tag);
        const grouped: Record<string, Delivery[]> = {};
        tagged.forEach((d) => {
          const tag = d.tag || "untagged";
          if (!grouped[tag]) grouped[tag] = [];
          grouped[tag].push(d);
        });'''

content2 = content2.replace(old2, replacement2)

with open('components/multiple-deliveries/multiple-deliveries-table.tsx', 'w', encoding='utf-8') as f:
    f.write(content2)
