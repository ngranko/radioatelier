<script lang="ts">
    import {activeObjectInfo, pointList} from '$lib/stores/map';
    import SearchItemCard from './searchItemCard.svelte';
    import {setCenter} from '$lib/services/map/map.svelte';
    import type {SearchItem} from '$lib/interfaces/object';

    interface Props {
        object: SearchItem;
    }

    let {object}: Props = $props();

    function handleClick() {
        setCenter(Number(object.lat), Number(object.lng));
        if (object.id && $pointList[object.id]) {
            google.maps.event.trigger($pointList[object.id].marker!, 'gmp-click');
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
