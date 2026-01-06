const API_URL = '/api/email';

async function sendEmail(payload: Record<string, unknown>): Promise<{ success: boolean; id?: string }> {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('[Email] Failed to send:', await response.text());
      return { success: false };
    }

    return response.json();
  } catch (error) {
    console.error('[Email] Error:', error);
    return { success: false };
  }
}

// Send welcome email to new user
export const sendWelcomeEmail = async (email: string, name: string) => {
  return sendEmail({
    action: 'welcome',
    to: email,
    name,
  });
};

// Send purchase confirmation to buyer
export const sendPurchaseConfirmation = async (params: {
  buyerEmail: string;
  buyerName: string;
  itemTitle: string;
  amount: number;
  sellerName: string;
  meetupDetails?: string;
}) => {
  return sendEmail({
    action: 'purchaseConfirmation',
    to: params.buyerEmail,
    buyer: params.buyerName,
    item: params.itemTitle,
    amount: params.amount,
    seller: params.sellerName,
    meetupDetails: params.meetupDetails,
  });
};

// Send sale notification to seller
export const sendSaleNotification = async (params: {
  sellerEmail: string;
  sellerName: string;
  itemTitle: string;
  amount: number;
  buyerName: string;
}) => {
  return sendEmail({
    action: 'saleNotification',
    to: params.sellerEmail,
    seller: params.sellerName,
    item: params.itemTitle,
    amount: params.amount,
    buyer: params.buyerName,
  });
};

// Send payout confirmation to seller
export const sendPayoutConfirmation = async (params: {
  sellerEmail: string;
  sellerName: string;
  amount: number;
  method: 'instant' | 'standard';
  arrivalDate: string;
}) => {
  return sendEmail({
    action: 'payoutConfirmation',
    to: params.sellerEmail,
    seller: params.sellerName,
    amount: params.amount,
    method: params.method,
    arrivalDate: params.arrivalDate,
  });
};

// Send review request to buyer (typically 24h after transaction)
export const sendReviewRequest = async (params: {
  buyerEmail: string;
  buyerName: string;
  itemTitle: string;
  sellerName: string;
  transactionId: string;
}) => {
  return sendEmail({
    action: 'reviewRequest',
    to: params.buyerEmail,
    buyer: params.buyerName,
    item: params.itemTitle,
    seller: params.sellerName,
    transactionId: params.transactionId,
  });
};
