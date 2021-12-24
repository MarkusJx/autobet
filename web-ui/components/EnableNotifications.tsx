import { Switch, Tooltip } from "@mui/material";
import React from "react";
import StaticInstances from "../src/util/StaticInstances";
import Container from "./util/Container";
import PushNotificationSubscriber from "../src/interfaces/PushNotificationSubscriber";
import PartialObjectValidator from "../src/util/PartialObjectValidator";

interface EnableNotificationsState {
    checked: boolean;
    disabled: boolean;
    tooltipTitle: string | null;
}

export default class EnableNotifications extends React.Component<{}, EnableNotificationsState> {
    private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
    private serviceWorker: ServiceWorker | null = null;

    public constructor(props: {}) {
        super(props);

        this.state = {
            checked: false,
            disabled: false,
            tooltipTitle: null
        };
    }

    private get notificationsSupported(): boolean {
        return typeof window !== "undefined" && !!window?.Notification && !!navigator?.serviceWorker;
    }

    private set switchDisabled(disabled: boolean) {
        this.setState({
            disabled: disabled
        });
    }

    private get permissionGranted(): boolean {
        if (!this.notificationsSupported) return false;

        return window.Notification.permission === "granted";
    }

    private get serviceWorkerActivated(): boolean {
        if (!this.notificationsSupported) return false;
        return this.serviceWorker?.state === "activated";
    }

    private set switchChecked(checked: boolean) {
        this.setState({
            checked: checked
        });
    }

    private set tooltipTitle(title: string | null) {
        this.setState({
            tooltipTitle: title
        });
    }

    private setServiceWorker(registration: ServiceWorkerRegistration): void {
        this.serviceWorkerRegistration = registration;
        this.serviceWorker = (registration.active || registration.installing || registration.waiting);
    }

    public override render(): React.ReactNode {
        return (
            <Container heading="Enable Notifications">
                <Tooltip title={this.state.tooltipTitle || "Enable/Disable Notifications"}>
                    <Switch onChange={this.onChange.bind(this)} disabled={this.state.disabled}
                        checked={this.state.checked} />
                </Tooltip>
            </Container>
        );
    }

    public override componentDidMount(): void {
        this.switchDisabled = true;
        if (this.notificationsSupported) {
            if (this.permissionGranted) {
                navigator.serviceWorker.getRegistration().then(registration => {
                    if (registration) {
                        this.setServiceWorker(registration);
                        this.switchChecked = this.serviceWorkerActivated;
                    }
                    this.switchDisabled = false;
                }).catch(console.warn);
            } else {
                this.switchDisabled = false;
            }
        } else {
            this.tooltipTitle = "Notifications are not supported by your browser";
        }
    }

    private async onChange(_: React.ChangeEvent<HTMLInputElement>, checked: boolean): Promise<void> {
        this.switchDisabled = true;
        this.switchChecked = checked;
        if (checked) {
            if (this.switchChecked) {
                this.switchChecked = true;
            } else if (this.notificationsSupported) {
                if ((await window.Notification.requestPermission()) !== "granted") {
                    this.switchChecked = false;
                    StaticInstances.notificationPermissionDeniedAlert?.show(5000);
                    await this.unregisterServiceWorkers();
                } else {
                    try {
                        const subscription = await this.subscribe();
                        const subJson = subscription.toJSON();
                        const subscriber: Partial<PushNotificationSubscriber> = {
                            subscriber: "sup dude",
                            endpoint: subJson.endpoint,
                            p256dh: subJson.keys?.p256dh,
                            auth: subJson.keys?.auth
                        };

                        await StaticInstances.api.push_notifications_subscribe(
                            PartialObjectValidator.validate(subscriber)
                        );
                        StaticInstances.notificationsEnabledAlert?.show(5000);
                    } catch (e) {
                        console.error(e);
                        StaticInstances.notificationErrorAlert?.setText(
                            "Could not enable notifications: An unknown error occurred"
                        );
                        StaticInstances.notificationErrorAlert?.show(5000);
                        this.switchChecked = false;
                        await this.unregisterServiceWorkers();
                    }
                }
            } else {
                StaticInstances.notificationErrorAlert?.setText(null);
                StaticInstances.notificationErrorAlert?.show(5000);
                this.switchChecked = false;
            }
        } else {
            if (this.notificationsSupported) {
                await Promise.all([
                    this.serviceWorkerRegistration?.pushManager?.getSubscription()
                        .then(s => s?.unsubscribe())
                        .catch(console.warn),
                    this.unregisterServiceWorkers().catch(console.warn)
                ]);
            }

            this.switchChecked = false;
            StaticInstances.notificationsDisabledAlert?.show(5000);
        }
        this.switchDisabled = false;
    }

    private async unregisterServiceWorkers(): Promise<void> {
        if (!this.notificationsSupported) return;
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(r => r.unregister()));
    }

    private async awaitServiceWorkerActivated(): Promise<void> {
        if (!this.serviceWorkerActivated) {
            await new Promise<void>(resolve => {
                const listener = () => {
                    if (this.serviceWorkerActivated) {
                        this.serviceWorker?.removeEventListener('statechange', listener);
                        resolve();
                    }
                }

                this.serviceWorker?.addEventListener('statechange', listener);
            });
        }
    }

    private async subscribe(): Promise<PushSubscription> {
        await this.unregisterServiceWorkers();
        this.setServiceWorker(await navigator.serviceWorker.register('serviceworker.js'));
        this.serviceWorker?.addEventListener('statechange', (): void => {
            this.switchChecked = this.serviceWorkerActivated;
        });

        await this.awaitServiceWorkerActivated();
        return await this.serviceWorkerRegistration!.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: await StaticInstances.api.get_app_server_key()
        });
    }
}