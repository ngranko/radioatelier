<script lang="ts">
    import {activeObjectInfo} from '$lib/stores/map';
    import SearchItemCard from './searchItemCard.svelte';
    import {setCenter} from '$lib/services/map/map.svelte';
    import type {SearchItem} from '$lib/interfaces/object';
    import {mapState} from '$lib/state/map.svelte.ts';

    interface Props {
        object: SearchItem;
    }

    let {object}: Props = $props();

    function handleClick() {
        if (!mapState.markerManager) {
            return;
        }

        setCenter(Number(object.lat), Number(object.lng));
        const marker = mapState.markerManager.getMarker(object.id);
        if (marker) {
            google.maps.event.trigger(marker, 'gmp-click');
        } else {
            activeObjectInfo.set({
                isLoading: false,
                isMinimized: false,
                isEditing: !Boolean(object.id),
                isDirty: false,
                detailsId: object.id ?? new Date().getTime().toString(),
                object: {
                    id: object.id,
                    name: object.name,
                    address: object.address,
                    city: object.city,
                    country: object.country,
                    lat: String(object.lat),
                    lng: String(object.lng),
                    isVisited: false,
                    isRemoved: false,
                },
            });
        }
    }
</script>

<SearchItemCard {object} onClick={handleClick} />
