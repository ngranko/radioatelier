import {api} from '$convex/_generated/api';
import type {Id} from '$convex/_generated/dataModel';
import type {ConvexClient} from 'convex/browser';
import posthog from 'posthog-js';
import {toast} from 'svelte-sonner';

export type ApprovalSource = 'details' | 'review_list';

export async function approveObject(
    client: ConvexClient,
    objectId: Id<'objects'>,
    source: ApprovalSource,
) {
    try {
        await client.mutation(api.objects.approve, {id: objectId});
        posthog.capture('object_approved', {object_id: objectId, source});
        toast.success('Объект подтверждён');
    } catch (error) {
        console.error('Failed to approve object:', error);
        toast.error('Не удалось подтвердить объект');
    }
}
