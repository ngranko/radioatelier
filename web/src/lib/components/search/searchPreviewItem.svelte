<script lang="ts">
    import type {SearchItem} from '$lib/interfaces/object';
    import {map, markerList, activeObjectInfo} from '$lib/stores/map';

    let {object} = $props();

    function composeAddress(object: SearchItem) {
        let result = object.address;

        if (object.address && (object.city || object.country)) {
            result += ', ';
        }

        result += object.city;

        if (object.city && object.country) {
            result += ', ';
        }

        result += object.country;

        return result;
    }

    function handleObjectClick() {
        $map.setCenter(new google.maps.LatLng(object.latitude, object.longitude));
        $map.setZoom(16);
        console.log(object);
        if (object.id && $markerList[object.id].marker) {
            google.maps.event.trigger($markerList[object.id].marker!, 'gmp-click');
        } else {
            console.log(object);
            activeObjectInfo.set({
                isLoading: false,
                isMinimized: false,
                isEditing: true,
                isDirty: false,
                detailsId: object.id ?? new Date().getTime().toString(),
                object: {
                    id: object.id,
                    name: object.name,
                    address: object.address,
                    city: object.city,
                    country: object.country,
                    lat: String(object.latitude),
                    lng: String(object.longitude),
                    isVisited: false,
                    isRemoved: false,
                },
            });
        }
    }
</script>

{#if !object.categoryName && !object.name && !object.address}
    <button class="object" onclick={handleObjectClick}>
        <div class="object-name">{object.latitude}, {object.longitude}</div>
    </button>
{:else}
    <button class="object" onclick={handleObjectClick}>
        <div class="object-address">{composeAddress(object)}</div>
        <div class="object-category">{object.categoryName}</div>
        <div class="object-name">{object.name}</div>
    </button>
{/if}

<style lang="scss">
    @use '../../../styles/colors';
    @use '../../../styles/typography';

    .object {
        @include typography.brand-face;
        padding: 4px 14px;
        width: 100%;
        background: none;
        border: 0;
        text-align: left;
        transition: background-color 0.1s ease-in-out;
        cursor: pointer;

        &:hover {
            background-color: colors.$lightgray;
        }

        &:last-child {
            padding-bottom: 8px;
        }
    }

    .object-address {
        @include typography.size-14;
        color: colors.$darkgray;
    }

    .object-category {
        @include typography.size-14;
        @include typography.weight-bold;
    }

    .object-name {
        @include typography.size-16;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
    }
</style>
