import { v4 as uuid } from 'uuid';

const PB_URL = process.env.POCKETBASE_URL;
const PB_TOKEN = process.env.POCKETBASE_SERVICE_TOKEN;

async function postPocketBase(collection, body) {
    if (!PB_URL || !PB_TOKEN) return false;
    const res = await fetch(`${PB_URL}/api/collections/${collection}/records`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': PB_TOKEN.startsWith('Bearer ')
                ? PB_TOKEN
                : `Bearer ${PB_TOKEN}`
        },
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`PocketBase error (${res.status}): ${text}`);
    }
    return true;
}

export async function storeReceipt({
    invoiceId,
    paymentIntentId,
    amount,
    currency,
    tenantId,
    payerEmail,
    method,
    reference,
    metadata = {}
}) {
    const receipt = {
        invoice_id: invoiceId,
        payment_intent_id: paymentIntentId,
        amount,
        currency,
        tenant_id: tenantId,
        payer_email: payerEmail,
        method,
        reference,
        metadata,
        issued_at: new Date().toISOString(),
        idempotency_key: uuid()
    };

    try {
        const sent = await postPocketBase('receipts', receipt);
        if (!sent) {
            console.warn('[receiptService] PocketBase not configured; receipt not persisted');
        }
        return receipt;
    } catch (err) {
        console.error('[receiptService] failed to persist receipt', err);
        throw err;
    }
}
