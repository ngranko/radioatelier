<script lang="ts">
    interface Props {
        address?: string;
        city?: string;
        country?: string;
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

<p class="text-foreground text-base">
    {composeAddress()}
</p>
