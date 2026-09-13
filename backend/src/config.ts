import "dotenv/config";

export const AMAZON_INTENTS = [
  "ORDER_TRACKING_DELIVERY", // Where is my package? Delayed shipment, carrier issue
  "RETURN_REFUND_REPLACEMENT",// Damaged item, wrong item, refund request, return label
  "DIGITAL_PRIME_SERVICES",  // Prime video, Kindle, music, subscription renewals
  "ACCOUNT_SECURITY_LOGIN",   // OTP failure, hacked account, unauthorized charges
  "PRODUCT_INQUIRY_STOCK",   // Is this in stock? Warranty details, seller questions
  "FEEDBACK_OR_CHITCHAT"     // General complaints, driver compliments, non-actionable
] as const;

export type AmazonIntent = typeof AMAZON_INTENTS[number];

export const BRAND_CONFIG = {
  brandHandle: "@AmazonHelp",
  maxTweetLength: 280,
  confidenceThreshold: 0.75, // Below this, force human escalation
  officialHelpUrl: "https://amazon.com/help",
};