import PartialObjectValidator from "../util/PartialObjectValidator";

export default interface PushNotificationSubscriber {
    subscriber: string;
    p256dh: string;
    auth: string;
    endpoint: string;
}

export function subscriptionToSubscriber(subscription: PushSubscriptionJSON): PushNotificationSubscriber {
    const subscriber: Partial<PushNotificationSubscriber> = {
        subscriber: "web@markusjx.github.io",
        endpoint: subscription.endpoint,
        p256dh: subscription.keys?.p256dh,
        auth: subscription.keys?.auth
    };

    return PartialObjectValidator.validate(subscriber);
}