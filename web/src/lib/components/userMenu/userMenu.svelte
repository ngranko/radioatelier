<script lang="ts">
    import LoggedInMenu from '$lib/components/userMenu/loggedInMenu.svelte';
    import LoggedOutMenu from '$lib/components/userMenu/loggedOutMenu.svelte';
    import {page} from '$app/state';

    if (!page.data.user) {
        throw new Error('User not found in page data');
    }
</script>

{#if page.data.user.auth}
    <LoggedInMenu />
{:else}
    <LoggedOutMenu />
{/if}
