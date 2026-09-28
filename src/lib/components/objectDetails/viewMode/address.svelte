<script lang="ts">
    import MapPinIcon from '@lucide/svelte/icons/map-pin';

    interface Props {
        address?: string | null;
        city?: string | null;
        country?: string | null;
    }

    let {address, city, country}: Props = $props();

    function composeAddress(): string {
        const addressArray: string[] = [];
        if (address) {
            addressArray.push(address);
        }
        if (city) {
            addressArray.push(city);
        }
        if (country) {
            addressArray.push(country);
        }
        return addressArray.join(', ');
    }
</script>

<p class="text-muted-foreground flex items-start gap-1.5 text-sm">
    <MapPinIcon class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
    {composeAddress()}
</p>
