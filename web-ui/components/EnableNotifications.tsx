import { Switch } from "@mui/material";
import React from "react";
import StaticInstances from "../src/util/StaticInstances";
import Container from "./util/Container";

interface EnableNotificationsState {
    checked: boolean;
    disabled: boolean;
}

export default class EnableNotifications extends React.Component<{}, EnableNotificationsState> {
    public constructor(props: {}) {
        super(props);

        this.state = {
            checked: this.permissionGranted,
            disabled: true
        };
    }

    public override render(): React.ReactNode {
        return (
            <Container heading="Enable Notifications">
                <Switch onChange={this.onChange.bind(this)} disabled={this.state.disabled} checked={this.state.checked} />
            </Container>
        );
    }

    public override componentDidMount(): void {
        if (this.notificationsSupported) {
            navigator.serviceWorker.register('').then(r => {
                const worker: ServiceWorker = (r.installing || r.waiting || r.active)!;
                if (!r.active) {
                    worker.addEventListener('statechange', (e: any) => {
                        this.switchDisabled = e.target?.state !== "active";
                        // TODO: Set the switch disabled/enabled
                    });
                }

                this.switchDisabled = !r.active;
            }).catch(console.error);
        }
    }

    private get notificationsSupported(): boolean {
        return !!window?.Notification && !!navigator?.serviceWorker;
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

    private set switchChecked(checked: boolean) {
        this.setState({
            checked: checked
        });
    }

    private async onChange(e: React.ChangeEvent<HTMLInputElement>, checked: boolean): Promise<void> {
        e.target.disabled = true;
        if (checked) {
            if (this.switchChecked) {
                this.switchChecked = true;
            } else if (this.notificationsSupported) {
                this.switchChecked = await window.Notification.requestPermission() === "granted";
                const subscription = await this.subscribe();
            } else {
                StaticInstances.notificationErrorAlert?.show(5000);
                this.switchChecked = false;
            }
        } else {
            // TODO: Un-listen from events
        }
        e.target.disabled = false;
    }

    private async subscribe(): Promise<PushSubscription> {
        const serviceWorker: ServiceWorkerRegistration = await navigator.serviceWorker.ready;
        return await serviceWorker.pushManager.subscribe({
            userVisibleOnly: true
        });
    }
}