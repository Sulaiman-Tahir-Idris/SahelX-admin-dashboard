content = """
import { initializeApp } from 'firebase-admin/app';
initializeApp();

export { onNewChatMessage } from './chat';
export { requestDeliveryWallet } from './wallet';
export { initializePaystackTransaction, verifyPaystackTransaction, paystackWebhook } from './paystack';
"""
with open('src/index.ts', 'w', encoding='utf-8') as f:
    f.write(content.strip())
