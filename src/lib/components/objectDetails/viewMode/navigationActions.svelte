<script lang="ts">
    import {Button} from '$lib/components/ui/button';
    import {getStreetView} from '$lib/services/map/streetView.svelte';
    import BinocularsIcon from '@lucide/svelte/icons/binoculars';
    import RouteIcon from '@lucide/svelte/icons/route';
    import {toast} from 'svelte-sonner';

    interface Props {
        lat: number;
        lng: number;
    }

    let {lat, lng}: Props = $props();

    const routeUrl = $derived(
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&dir_action=navigate`,
    );

    function handleStreetViewClick() {
        getStreetView(lat, lng).catch(error => {
            console.error(error);
            toast.error('Нет панорамы для этой точки');
        });
    }
</script>

<Button
    variant="ghost"
    size="icon"
    class="text-muted-foreground hover:text-foreground"
    href={routeUrl}
    target="_blank"
    rel="noopener"
    aria-label="Проложить маршрут"
    title="Проложить маршрут"
>
    <RouteIcon />
</Button>
<Button
    variant="ghost"
    size="icon"
    class="text-muted-foreground hover:text-foreground"
    onclick={handleStreetViewClick}
    aria-label="Открыть панораму"
    title="Открыть панораму"
>
    <BinocularsIcon />
</Button>
