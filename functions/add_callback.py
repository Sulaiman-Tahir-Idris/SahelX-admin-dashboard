filepath = r"src/paystack.ts"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add paystackCallback
callback_code = """
export const paystackCallback = onRequest(async (req, res) => {
  // Paystack redirects here after a transaction.
  // We just serve a simple HTML page telling the user to close the browser.
  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Successful</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f9fafb; color: #111827; text-align: center; padding: 20px; }
        .card { background: white; padding: 40px 20px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); max-width: 400px; width: 100%; }
        .icon { font-size: 48px; margin-bottom: 16px; }
        h1 { font-size: 24px; margin-bottom: 8px; font-weight: 600; }
        p { font-size: 16px; color: #4b5563; line-height: 1.5; margin-bottom: 24px; }
        button { background-color: #dc2626; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; width: 100%; }
        button:hover { background-color: #b91c1c; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon">✅</div>
        <h1>Payment Successful!</h1>
        <p>Your transaction has been processed securely. You can now close this window and return to the SahelX app.</p>
        <button onclick="window.close()">Close Window</button>
      </div>
      <script>
        // Attempt to close automatically after 3 seconds
        setTimeout(() => {
          window.close();
        }, 3000);
      </script>
    </body>
    </html>
  `);
});
"""

content = content + "\n" + callback_code

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Added paystackCallback")
