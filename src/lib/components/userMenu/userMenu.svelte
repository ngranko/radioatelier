<script lang="ts">
    import LoggedInMenu from '$lib/components/userMenu/loggedInMenu.svelte';
    import LoggedOutMenu from '$lib/components/userMenu/loggedOutMenu.svelte';
    import {SignedIn, SignedOut} from 'svelte-clerk';
</script>

<!-- TODO: add a case for clerk loading -->
<SignedIn>
    <LoggedInMenu />
</SignedIn>
<SignedOut>
    <LoggedOutMenu />
</SignedOut>
