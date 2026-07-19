<script lang="ts">
    import LoggedInMenu from '$lib/components/userMenu/loggedInMenu.svelte';
    import LoggedOutMenu from '$lib/components/userMenu/loggedOutMenu.svelte';
    import {Show} from 'svelte-clerk';
</script>

<!-- TODO: add a case for clerk loading -->
<Show when="signed-in">
    <LoggedInMenu />
</Show>
<Show when="signed-out">
    <LoggedOutMenu />
</Show>
