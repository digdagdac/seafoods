export const ALERT_QUEUE_NAME = 'alert-notification';
export const ALERT_CREATE_JOB = 'create-alert-from-sanction';

export const SUBSCRIPTION_TYPES = {
  REGION: 'REGION',
  CATEGORY: 'CATEGORY',
  RESTAURANT: 'RESTAURANT',
} as const;

export type SubscriptionTypeValue =
  (typeof SUBSCRIPTION_TYPES)[keyof typeof SUBSCRIPTION_TYPES];

export const ALERT_TYPES = {
  BOOKMARK_SANCTION: 'BOOKMARK_SANCTION',
  REGION_SANCTION: 'REGION_SANCTION',
  CATEGORY_SANCTION: 'CATEGORY_SANCTION',
} as const;

export type AlertTypeValue = (typeof ALERT_TYPES)[keyof typeof ALERT_TYPES];
