import {describe, expect, it} from 'vitest';
import type {Doc, Id} from './_generated/dataModel';
import {buildNotionPropertiesPayload, readNotionPageFields} from './notion/fields';
import type {NotionDataSource, NotionPage, NotionPageFields} from './notion/types';
import {computeNotionWebhookSignature, verifyNotionWebhookSignature} from './notion/webhooks';
import {chooseObjectOwner} from './notionSync/identity';
import {decideInboundSync} from './notionSync/inboundDecision';
import {
    computeFieldDiscrepancies,
    computeNotionToAppDiff,
    computeSyncHash,
    findMatchForAppObject,
} from './notionSync/reconcile';
import type {ObjectSyncSnapshot} from './notionSync/snapshot';
import {
    buildSyncErrorPatch,
    buildSyncStateArgs,
    needsSyncErrorPatchWrite,
    needsSyncStateWrite,
} from './notionSync/state';
import type {AppSyncFields} from './notionSync/types';

const appFields: AppSyncFields = {
    name: 'Radio House',
    categoryName: 'installation',
    address: null,
    city: 'Paris',
    country: 'France',
    mapLink: 'https://radioatelier.app/object/abc123',
    internalId: 'RA-1',
    installedPeriod: '2020',
    isRemoved: false,
    removalPeriod: null,
    tagNames: ['sound', 'historic'],
    isVisited: false,
    source: 'https://example.com',
};

describe('notion sync matching', () => {
    it('matches by map link first', () => {
        const match = findMatchForAppObject(
            'abc123',
            appFields,
            [
                {
                    id: 'page-1',
                    fields: {
                        ...appFields,
                        mapLink: 'https://radioatelier.app/object/abc123',
                    },
                },
            ],
            null,
        );

        expect(match).toEqual({
            kind: 'matched_by_link',
            pageId: 'page-1',
        });
    });

    it('keeps mapLink out of inbound app patches', () => {
        const {appPatch} = computeNotionToAppDiff(appFields, {
            ...appFields,
            mapLink: 'https://radioatelier.app/object/changed',
            city: 'Berlin',
        });

        expect(appPatch).toEqual({
            city: 'Berlin',
        });
    });

    it('keeps internalId out of inbound app patches', () => {
        const {appPatch} = computeNotionToAppDiff(appFields, {
            ...appFields,
            internalId: 'RA-999',
            city: 'Berlin',
        });

        expect(appPatch).toEqual({
            city: 'Berlin',
        });
    });

    it('normalizes tag order when computing sync hashes', () => {
        expect(computeSyncHash(appFields)).toBe(
            computeSyncHash({
                ...appFields,
                tagNames: ['historic', 'sound'],
            }),
        );
    });

    it('reports differing sync fields between app and Notion snapshots', () => {
        expect(
            computeFieldDiscrepancies(appFields, {
                ...appFields,
                city: 'Berlin',
                tagNames: ['historic'],
                isVisited: true,
            }),
        ).toEqual({
            differingFields: ['city', 'isVisited', 'tagNames'],
            inSync: false,
        });
    });
});

describe('notion inbound sync decisions', () => {
    it('deletes the linked Object when the Notion page is removed', () => {
        expect(
            decideInboundSync({
                eventType: 'page.deleted',
                pageState: 'removed',
                existingSync: {
                    objectId: objectId('object-1'),
                    lastOutboundHash: null,
                },
                notionFields: null,
                existingSnapshot: null,
            }),
        ).toEqual({
            kind: 'deleteObject',
            objectId: objectId('object-1'),
        });
    });

    it('records an echo when Notion sends back the last outbound state', () => {
        const lastOutboundHash = computeSyncHash(appFields);

        expect(
            decideInboundSync({
                eventType: 'page.properties_updated',
                pageState: 'active',
                existingSync: {
                    objectId: objectId('object-1'),
                    lastOutboundHash,
                },
                notionFields: appFields,
                existingSnapshot: objectSnapshot('object-1', appFields),
            }),
        ).toEqual({
            kind: 'recordEcho',
            objectId: objectId('object-1'),
            lastOutboundHash,
        });
    });

    it('patches an existing Object when Notion fields changed', () => {
        expect(
            decideInboundSync({
                eventType: 'page.properties_updated',
                pageState: 'active',
                existingSync: {
                    objectId: objectId('object-1'),
                    lastOutboundHash: 'older-hash',
                },
                notionFields: {...appFields, city: 'Berlin'},
                existingSnapshot: objectSnapshot('object-1', appFields),
            }),
        ).toEqual({
            kind: 'patchObject',
            objectId: objectId('object-1'),
            patch: {city: 'Berlin'},
        });
    });

    it('unmatched page.created uses create flow when no linked object exists', () => {
        expect(
            decideInboundSync({
                eventType: 'page.created',
                pageState: 'active',
                existingSync: null,
                notionFields: {
                    ...appFields,
                    mapLink: 'https://radioatelier.app/object/object-1',
                    city: 'Berlin',
                },
                existingSnapshot: null,
            }),
        ).toEqual({
            kind: 'createObject',
            fields: {
                ...appFields,
                mapLink: 'https://radioatelier.app/object/object-1',
                city: 'Berlin',
            },
        });
    });

    it('requests geocoding before creating an Object for a new Notion page', () => {
        const notionFields: NotionPageFields = {
            ...appFields,
            mapLink: null,
        };

        expect(
            decideInboundSync({
                eventType: 'page.created',
                pageState: 'active',
                existingSync: null,
                notionFields,
                existingSnapshot: null,
            }),
        ).toEqual({
            kind: 'createObject',
            fields: notionFields,
        });
    });

    it('skips unmatched Notion updates that are not creates', () => {
        expect(
            decideInboundSync({
                eventType: 'page.properties_updated',
                pageState: 'active',
                existingSync: null,
                notionFields: {...appFields, mapLink: null},
                existingSnapshot: null,
            }),
        ).toEqual({kind: 'skip'});
    });
});

describe('notion sync identity', () => {
    it('prefers an eligible mapped owner over the fallback owner', () => {
        const mappedOwner = makeStubOwner({id: 'mapped', notionSyncEnabled: true});
        const fallbackOwner = makeStubOwner({id: 'fallback', notionSyncEnabled: true});

        expect(chooseObjectOwner(mappedOwner, fallbackOwner)).toBe(mappedOwner);
    });

    it('falls back when the mapped owner cannot receive sync Objects', () => {
        const mappedOwner = makeStubOwner({id: 'mapped', notionSyncEnabled: false});
        const fallbackOwner = makeStubOwner({id: 'fallback', notionSyncEnabled: true});

        expect(chooseObjectOwner(mappedOwner, fallbackOwner)).toBe(fallbackOwner);
    });

    it('rejects deleted or sync-disabled fallback owners', () => {
        expect(
            chooseObjectOwner(
                null,
                makeStubOwner({id: 'fallback', notionSyncEnabled: true, isDeleted: true}),
            ),
        ).toBeNull();
        expect(
            chooseObjectOwner(null, makeStubOwner({id: 'fallback', notionSyncEnabled: false})),
        ).toBeNull();
    });
});

describe('notion sync state records', () => {
    it('derives outbound state from the latest observed Notion edit time', () => {
        const now = 1_716_000_000_000;

        expect(
            buildSyncStateArgs(
                {
                    kind: 'outboundSynced',
                    objectId: objectId('object-1'),
                    notionPageId: 'page-1',
                    fields: appFields,
                    notionLastEditedTime: 'after-update',
                },
                now,
            ),
        ).toEqual({
            objectId: objectId('object-1'),
            notionPageId: 'page-1',
            lastOutboundHash: computeSyncHash(appFields),
            lastInboundEditedTime: 'after-update',
            archivedAt: null,
            lastSyncError: null,
            lastSyncedAt: now,
        });
    });

    it('preserves outbound hash when recording an inbound echo', () => {
        const now = 1_716_000_000_001;

        expect(
            buildSyncStateArgs(
                {
                    kind: 'inboundEcho',
                    objectId: objectId('object-1'),
                    notionPageId: 'page-1',
                    lastOutboundHash: 'same-hash',
                    notionLastEditedTime: 'echo-edit',
                },
                now,
            ),
        ).toMatchObject({
            lastOutboundHash: 'same-hash',
            lastInboundEditedTime: 'echo-edit',
            lastSyncError: null,
            lastSyncedAt: now,
        });
    });

    it('builds error patches without requiring callers to know row fields', () => {
        expect(buildSyncErrorPatch('Notion failed', 1_716_000_000_002)).toEqual({
            lastSyncError: 'Notion failed',
            lastSyncedAt: 1_716_000_000_002,
        });
    });

    it('skips sync-state writes when the existing record already matches', () => {
        const now = 1_716_000_000_003;
        const existing = makeSyncRecord();
        const next = buildSyncStateArgs(
            {
                kind: 'outboundSynced',
                objectId: objectId('object-1'),
                notionPageId: 'page-1',
                fields: appFields,
                notionLastEditedTime: 'edited-1',
            },
            now,
        );

        expect(needsSyncStateWrite(existing, next)).toBe(false);
    });

    it('requires sync-state writes when establishing or repairing links', () => {
        const now = 1_716_000_000_003;
        const existing = makeSyncRecord();
        const next = buildSyncStateArgs(
            {
                kind: 'outboundSynced',
                objectId: objectId('object-1'),
                notionPageId: 'page-1',
                fields: appFields,
                notionLastEditedTime: 'edited-1',
            },
            now,
        );

        expect(needsSyncStateWrite(null, next)).toBe(true);
        expect(needsSyncStateWrite(makeSyncRecord({lastOutboundHash: null}), next)).toBe(true);
        expect(needsSyncStateWrite(makeSyncRecord({lastSyncError: 'Notion failed'}), next)).toBe(
            true,
        );
        expect(
            needsSyncStateWrite(existing, {
                ...next,
                lastInboundEditedTime: 'edited-2',
            }),
        ).toBe(true);
    });

    it('skips error patches when the stored message is unchanged', () => {
        expect(
            needsSyncErrorPatchWrite(
                makeSyncRecord({lastSyncError: 'Notion failed'}),
                'Notion failed',
            ),
        ).toBe(false);
        expect(
            needsSyncErrorPatchWrite(makeSyncRecord({lastSyncError: 'Notion failed'}), null),
        ).toBe(true);
    });
});

describe('notion sync fields', () => {
    it('builds property payloads using the configured schema types', () => {
        const dataSource: NotionDataSource = {
            id: 'ds-1',
            properties: {
                Название: {type: 'title'},
                Тип: {type: 'select'},
                Адрес: {type: 'rich_text'},
                Город: {type: 'rich_text'},
                Страна: {type: 'rich_text'},
                'Ссылка на архив': {type: 'url'},
                'Внутренний ID': {type: 'rich_text'},
                'Период установки': {type: 'rich_text'},
                Демонтирован: {type: 'checkbox'},
                'Период демонтажа': {type: 'rich_text'},
                Теги: {type: 'multi_select'},
                Посещен: {type: 'checkbox'},
                Источник: {type: 'url'},
            },
        };

        expect(buildNotionPropertiesPayload(dataSource, appFields)).toEqual({
            Название: {
                title: [{text: {content: 'Radio House'}}],
            },
            Тип: {select: {name: 'installation'}},
            Адрес: {rich_text: []},
            Город: {
                rich_text: [{text: {content: 'Paris'}}],
            },
            Страна: {
                rich_text: [{text: {content: 'France'}}],
            },
            'Ссылка на архив': {
                url: 'https://radioatelier.app/object/abc123',
            },
            'Внутренний ID': {
                rich_text: [{text: {content: 'RA-1'}}],
            },
            'Период установки': {
                rich_text: [{text: {content: '2020'}}],
            },
            Демонтирован: {
                checkbox: false,
            },
            'Период демонтажа': {
                rich_text: [],
            },
            Теги: {
                multi_select: [{name: 'sound'}, {name: 'historic'}],
            },
            Посещен: {
                checkbox: false,
            },
            Источник: {
                url: 'https://example.com',
            },
        });
    });

    it('reads page properties back into sync fields', () => {
        const page: NotionPage = {
            id: 'page-1',
            properties: {
                Название: {
                    type: 'title',
                    title: [{plain_text: 'Radio House'}],
                },
                Тип: {
                    type: 'select',
                    select: {name: 'installation'},
                },
                Адрес: {
                    type: 'rich_text',
                    rich_text: [{plain_text: 'Rue Example'}],
                },
                Город: {
                    type: 'rich_text',
                    rich_text: [{plain_text: 'Paris'}],
                },
                Страна: {
                    type: 'rich_text',
                    rich_text: [{plain_text: 'France'}],
                },
                'Ссылка на архив': {
                    type: 'url',
                    url: 'https://radioatelier.app/object/abc123',
                },
                'Внутренний ID': {
                    type: 'rich_text',
                    rich_text: [{plain_text: 'RA-1'}],
                },
                'Период установки': {
                    type: 'rich_text',
                    rich_text: [{plain_text: '2020'}],
                },
                Демонтирован: {
                    type: 'checkbox',
                    checkbox: true,
                },
                'Период демонтажа': {
                    type: 'rich_text',
                    rich_text: [{plain_text: '2024'}],
                },
                Теги: {
                    type: 'multi_select',
                    multi_select: [{name: 'sound'}, {name: 'historic'}],
                },
                Посещен: {
                    type: 'checkbox',
                    checkbox: true,
                },
                Источник: {
                    type: 'url',
                    url: 'https://example.com',
                },
            },
        };

        expect(readNotionPageFields(page)).toEqual({
            name: 'Radio House',
            categoryName: 'installation',
            address: 'Rue Example',
            city: 'Paris',
            country: 'France',
            mapLink: 'https://radioatelier.app/object/abc123',
            internalId: 'RA-1',
            installedPeriod: '2020',
            isRemoved: true,
            removalPeriod: '2024',
            tagNames: ['sound', 'historic'],
            isVisited: true,
            source: 'https://example.com',
        });
    });

    it('normalizes blank url fields to null for Notion validation', () => {
        const dataSource: NotionDataSource = {
            id: 'ds-1',
            properties: {
                Название: {type: 'title'},
                Тип: {type: 'select'},
                Адрес: {type: 'rich_text'},
                Город: {type: 'rich_text'},
                Страна: {type: 'rich_text'},
                'Ссылка на архив': {type: 'url'},
                'Внутренний ID': {type: 'rich_text'},
                'Период установки': {type: 'rich_text'},
                Демонтирован: {type: 'checkbox'},
                'Период демонтажа': {type: 'rich_text'},
                Теги: {type: 'multi_select'},
                Посещен: {type: 'checkbox'},
                Источник: {type: 'url'},
            },
        };

        expect(
            buildNotionPropertiesPayload(dataSource, {
                ...appFields,
                source: '',
            }).Источник,
        ).toEqual({
            url: null,
        });
    });
});

function objectSnapshot(id: string, fields: AppSyncFields): ObjectSyncSnapshot {
    return {
        objectId: objectId(id),
        owner: {
            _id: userId('user-1'),
            notionSyncEnabled: true,
        },
        sync: null,
        fields,
    };
}

function objectId(id: string) {
    return id as Id<'objects'>;
}

function userId(id: string) {
    return id as Id<'users'>;
}

function makeSyncRecord(overrides: Partial<Doc<'objectNotionSync'>> = {}): Doc<'objectNotionSync'> {
    return {
        _id: 'sync-1' as Id<'objectNotionSync'>,
        _creationTime: 0,
        objectId: objectId('object-1'),
        notionPageId: 'page-1',
        lastOutboundHash: computeSyncHash(appFields),
        lastInboundEditedTime: 'edited-1',
        archivedAt: null,
        lastSyncError: null,
        lastSyncedAt: 1_716_000_000_000,
        ...overrides,
    };
}

function makeStubOwner(input: {id: string; notionSyncEnabled: boolean; isDeleted?: boolean}) {
    return {
        id: input.id,
        notionSyncEnabled: input.notionSyncEnabled,
        isDeleted: input.isDeleted ?? false,
    };
}

describe('notion webhook signatures', () => {
    it('verifies HMAC signatures using the Notion verification token', async () => {
        const payload = JSON.stringify({entity: {id: 'page-1'}, type: 'page.created'});
        const verificationToken = 'secret_123';
        const signature = await computeNotionWebhookSignature(payload, verificationToken);

        await expect(
            verifyNotionWebhookSignature(payload, signature, verificationToken),
        ).resolves.toBe(true);
        await expect(
            verifyNotionWebhookSignature(payload, signature, 'wrong_secret'),
        ).resolves.toBe(false);
    });
});
