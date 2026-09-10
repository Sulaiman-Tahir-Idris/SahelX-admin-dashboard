import os

filepath = r"components/customers/customer-profile.tsx"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Imports
content = content.replace('import { getCustomer } from "@/lib/firebase/customers";', 'import { getCustomer, updateCustomerVerification } from "@/lib/firebase/customers";\nimport { useRole } from "@/lib/hooks/use-role";\nimport { BadgeCheck } from "lucide-react";\nimport { useToast } from "@/hooks/use-toast";')

# Hooks
content = content.replace('const [loading, setLoading] = useState(true);', 'const [loading, setLoading] = useState(true);\n  const [verifying, setVerifying] = useState(false);\n  const role = useRole();\n  const { toast } = useToast();\n\n  const handleVerify = async () => {\n    if (role !== "admin") return;\n    setVerifying(true);\n    try {\n      const newStatus = !customer.isVerified;\n      await updateCustomerVerification(customerId, newStatus);\n      setCustomer({ ...customer, isVerified: newStatus });\n      toast({ title: newStatus ? "Customer verified" : "Verification revoked", variant: "default" });\n    } catch (err) {\n      toast({ title: "Error updating verification", variant: "destructive" });\n    } finally {\n      setVerifying(false);\n    }\n  };')

# Button
button_code = '''
              <div className="flex space-x-2">
                {role === "admin" && (
                  <Button
                    variant={customer.isVerified ? "outline" : "default"}
                    onClick={handleVerify}
                    disabled={verifying}
                  >
                    <BadgeCheck className="mr-2 h-4 w-4" />
                    {customer.isVerified ? "Revoke Verification" : "Verify Account"}
                  </Button>
                )}
                <Button
                  variant="outline"
'''
content = content.replace('              <div className="flex space-x-2">\n                <Button\n                  variant="outline"', button_code)

# Name badge
badge_code = '''
                    <h2 className="text-2xl font-bold flex items-center">
                      {customer.displayName ||
                        customer.fullName ||
                        customer.email}
                      {customer.isVerified && (
                        <BadgeCheck className="ml-2 h-6 w-6 text-red-500 fill-current text-white bg-red-500 rounded-full p-[2px]" />
                      )}
                    </h2>
'''
content = content.replace('''                    <h2 className="text-2xl font-bold">
                      {customer.displayName ||
                        customer.fullName ||
                        customer.email}
                    </h2>''', badge_code)


with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
