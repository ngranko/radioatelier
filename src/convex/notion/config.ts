import type {NotionPage} from './types';

function getRequiredEnv(name: string) {
    const value = process.env[name]?.trim();
    if (!value) {
        throw new Error(`Missing ${name} environment variable`);
    }
    return value;
}

export function getNotionApiKey() {
    return getRequiredEnv('NOTION_API_KEY');
}

export function getNotionDataSourceId() {
    return getRequiredEnv('NOTION_DATA_SOURCE_ID');
}

export function getNotionSyncAppUrl() {
    return getRequiredEnv('NOTION_SYNC_APP_URL');
}

export function getNotionWebhookVerificationToken() {
    return getRequiredEnv('NOTION_WEBHOOK_VERIFICATION_TOKEN');
}

export function getNotionSyncFallbackUserExternalId() {
    return getRequiredEnv('NOTION_SYNC_FALLBACK_USER_EXTERNAL_ID');
}

export function belongsToConfiguredDataSource(page: NotionPage) {
    return (
        page.parent?.type === 'data_source_id' &&
        page.parent.data_source_id === getNotionDataSourceId()
    );
}
