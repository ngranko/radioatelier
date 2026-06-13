import type {SessionJSON, WebhookEvent} from '@clerk/backend';
import {httpRouter} from 'convex/server';
import {Webhook} from 'svix';
import {internal} from './_generated/api';
import {httpAction} from './_generated/server';
import {clerkTimestamp} from './helpers/clerkTimestamps';
import {getNotionWebhookVerificationToken} from './notion/config';
import {verifyNotionWebhookSignature} from './notion/webhooks';

const http = httpRouter();

http.route({
    path: '/clerk-users-webhook',
    method: 'POST',
    handler: httpAction(async (ctx, request) => {
        const event = await validateRequest(request);
        if (!event) {
            return new Response('Error occurred', {status: 400});
        }
        switch (event.type) {
            case 'user.created': // intentional fallthrough
            case 'user.updated':
                await ctx.runMutation(internal.users.upsertFromClerk, {
                    data: event.data,
                });
                break;

            case 'user.deleted': {
                const clerkUserId = event.data.id;
                if (!clerkUserId) {
                    console.error('Received user.deleted event without user id');
                    return new Response('Invalid event data', {status: 400});
                }
                await ctx.runMutation(internal.users.deleteFromClerk, {clerkUserId});
                break;
            }
            case 'session.created': {
                const session = event.data as SessionJSON;
                const clerkUserId = session.user_id;
                const lastLoginAt = clerkTimestamp(session.created_at);
                const lastActiveAt = clerkTimestamp(session.last_active_at) ?? lastLoginAt;
                if (!clerkUserId || lastLoginAt === null || lastActiveAt === null) {
                    console.error('Received session.created event without required session data');
                    return new Response('Invalid event data', {status: 400});
                }
                await ctx.runMutation(internal.users.recordSessionFromClerk, {
                    clerkUserId,
                    lastActiveAt,
                    lastLoginAt,
                });
                break;
            }
            default:
                console.log('Ignored Clerk webhook event', event.type);
        }

        return new Response(null, {status: 200});
    }),
});

http.route({
    path: '/notion-webhook',
    method: 'POST',
    handler: httpAction(async (ctx, request) => {
        const payload = await request.text();
        let body: Record<string, unknown>;
        try {
            body = JSON.parse(payload) as Record<string, unknown>;
        } catch {
            return new Response('Invalid JSON payload', {status: 400});
        }

        if (typeof body.verification_token === 'string') {
            // this is a verification request, we need to paste this token into Notion
            console.log(`Received Notion webhook verification token: ${body.verification_token}`);
            return new Response(null, {status: 200});
        }

        const signature = request.headers.get('x-notion-signature');
        if (!signature) {
            return new Response('Missing Notion signature', {status: 401});
        }

        const isTrusted = await verifyNotionWebhookSignature(
            payload,
            signature,
            getNotionWebhookVerificationToken(),
        );
        if (!isTrusted) {
            return new Response('Invalid Notion signature', {status: 401});
        }

        const eventType = typeof body.type === 'string' ? body.type : null;
        const pageId =
            body.entity &&
            typeof body.entity === 'object' &&
            typeof (body.entity as {id?: unknown}).id === 'string'
                ? (body.entity as {id: string}).id
                : null;
        if (!eventType || !pageId || !isSupportedNotionEvent(eventType)) {
            return new Response(null, {status: 200});
        }

        await ctx.runAction(internal.notionSync.inbound.processWebhookEvent, {
            pageId,
            eventType,
        });

        return new Response(null, {status: 200});
    }),
});

async function validateRequest(req: Request): Promise<WebhookEvent | null> {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
        console.error('Missing CLERK_WEBHOOK_SECRET environment variable');
        return null;
    }

    const payloadString = await req.text();
    const svixId = req.headers.get('svix-id');
    const svixTimestamp = req.headers.get('svix-timestamp');
    const svixSignature = req.headers.get('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
        console.error('Missing required svix headers');
        return null;
    }

    const svixHeaders = {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
    };
    const wh = new Webhook(webhookSecret);

    try {
        return wh.verify(payloadString, svixHeaders) as unknown as WebhookEvent;
    } catch (error) {
        console.error('Error verifying webhook event', error);
        return null;
    }
}

export default http;

function isSupportedNotionEvent(eventType: string) {
    return (
        eventType === 'page.created' ||
        eventType === 'page.properties_updated' ||
        eventType === 'page.deleted' ||
        eventType === 'page.undeleted'
    );
}
