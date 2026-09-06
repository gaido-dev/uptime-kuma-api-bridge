import type { UptimeKumaSocketClient } from "../uptime-kuma-client/UptimeKumaSocketClient.js";

export interface NotificationDto {
    id: number;
    name: string;
    active: boolean;
    isDefault: boolean;
}

/**
 * Exposes Uptime Kuma's notification providers (id + name) so an external provisioning tool
 * can populate `notificationIds` when creating a monitor. The list is pushed by Uptime Kuma
 * to every socket logged in as the service account (`server/client.js: sendNotificationList`)
 * and kept in memory by `UptimeKumaSocketClient` — no extra round-trip needed here.
 */
export class NotificationService {
    constructor(private readonly client: UptimeKumaSocketClient) {}

    list(): NotificationDto[] {
        return this.client.getCachedNotifications().map((notification) => ({
            id: notification.id,
            name: notification.name,
            active: notification.active,
            isDefault: notification.isDefault,
        }));
    }
}
