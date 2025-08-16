<script lang="ts">
    import {onMount, onDestroy} from 'svelte';
    import {
        mapLoader,
        map,
        markerManager,
        activeObjectInfo,
        activeMarker,
        searchPointList,
    } from '$lib/stores/map';
    import {createQuery, useQueryClient} from '@tanstack/svelte-query';
    import {getObject} from '$lib/api/object';
    import {useRepositionMutation} from '$lib/api/mutation/reposition';
    import {getAddress} from '$lib/api/location';
    import type {Object} from '$lib/interfaces/object';
    import {pointList} from '$lib/stores/map.js';
    import {setDraggable} from '$lib/services/map/map.svelte';

    interface Props {
        id?: string | null;
        lat: string;
        lng: string;
        isRemoved?: boolean;
        isVisited?: boolean;
        initialActive?: boolean;
        icon: string;
        color: string;
        isDraggable?: boolean;
        source: 'map' | 'list' | 'search';
    }

    let {
        id = null,
        lat,
        lng,
        isRemoved = false,
        isVisited = false,
        icon,
        color,
        isDraggable = false,
        source,
    }: Props = $props();

    let markerId: string | undefined = $state();
    let marker: google.maps.marker.AdvancedMarkerElement | null = $state(null);
    let skipClick = false;
    let isDragged = false;
    let mouseMoveListener: google.maps.MapsEventListener | null = null;
    let boundsListener: google.maps.MapsEventListener | null = null;

    const client = useQueryClient();

    const objectDetails = createQuery({
        queryKey: ['object', {id: id ?? ''}],
        queryFn: getObject,
        enabled: false,
    });

    const objectAddress = createQuery({
        queryKey: ['objectAddress', {lat, lng}],
        queryFn: getAddress,
        enabled: false,
    });

    const reposition = useRepositionMutation(client);

    // Update marker appearance when marker is available or state changes
    $effect(() => {
        if (!marker || !marker.content) {
            return;
        }

        // Update marker appearance based on state
        calculateStateStyles();
    });

    // Additional effect to handle when marker becomes available (for lazy markers)
    $effect(() => {
        if (marker && marker.content) {
            // Apply styles immediately when marker becomes available
            setTimeout(() => {
                calculateStateStyles();
            }, 10);
        }
    });

    $effect(() => {
        if (!marker) {
            return;
        }

        // isLoading check is needed here because otherwise creating a duplicate marker for an object that was already open before will immediately trigger the details to open (TSK-286)
        if (
            $activeObjectInfo.isLoading &&
            $objectDetails.isSuccess &&
            $activeObjectInfo.detailsId === $objectDetails.data.data.object.id
        ) {
            activeObjectInfo.set({
                isLoading: false,
                isEditing: false,
                isMinimized: false,
                isDirty: false,
                detailsId: $objectDetails.data.data.object.id,
                object: $objectDetails.data.data.object,
            });
        }

        if ($objectDetails.isError) {
            console.error($objectDetails.error);
            // Set loading to false on error to prevent stuck loading state
            if ($activeObjectInfo.isLoading && $activeObjectInfo.detailsId === id) {
                activeObjectInfo.update(value => ({
                    ...value,
                    isLoading: false,
                }));
            }
        }
    });

    $effect(() => {
        if (!marker) {
            return;
        }

        if ($objectAddress.isSuccess) {
            activeObjectInfo.update(value => ({
                ...value,
                isLoading: false,
                object: {
                    ...(value.object as Object),
                    address: $objectAddress.data?.data.address ?? '',
                    city: $objectAddress.data?.data.city ?? '',
                    country: $objectAddress.data?.data.country ?? '',
                },
            }));
        }

        if ($objectAddress.isError) {
            console.error($objectAddress.error);
            activeObjectInfo.update(value => ({
                ...value,
                isLoading: false,
            }));
        }
    });

    onMount(() => {
        createMarker();

        // Event listener for when lazy markers become available
        const handleMarkerAvailable = (event: CustomEvent) => {
            if (event.detail.markerId === markerId) {
                marker = event.detail.marker;

                // Apply styles immediately
                setTimeout(() => {
                    calculateStateStyles();
                }, 10);
            }
        };

        // Event listener for style updates (needed for lazy markers in large datasets)
        const handleMarkerStyleUpdate = (event: CustomEvent) => {
            if (event.detail.markerId === markerId) {
                // For lazy markers, the marker might not be available yet
                // The styles will be applied when the marker becomes available via the effect
                if (marker) {
                    calculateStateStyles();
                }
            }
        };

        window.addEventListener('marker-available', handleMarkerAvailable as EventListener);
        window.addEventListener('marker-style-update', handleMarkerStyleUpdate as EventListener);

        // Cleanup listener on destroy
        return () => {
            window.removeEventListener('marker-available', handleMarkerAvailable as EventListener);
            window.removeEventListener(
                'marker-style-update',
                handleMarkerStyleUpdate as EventListener,
            );
        };
    });

    function createMarker() {
        const position = {lat: Number(lat), lng: Number(lng)};

        // For map-clicked markers, pass a unique ID to avoid cache conflicts
        markerId = id ?? `map-${Date.now()}-${Math.random()}`;

        const createdMarker = $markerManager!.createMarker(markerId, position, {
            icon,
            color,
            isDraggable,
            source,
            onClick: handleMarkerClick,
            onDragStart: handleClickStart,
            onDragEnd: handleClickEnd,
        });

        marker = createdMarker || null;

        // Test: Force style calculation after marker creation
        if (marker) {
            setTimeout(() => {
                calculateStateStyles();
            }, 100);
        }

        if (
            id === null &&
            $activeObjectInfo.object &&
            !$activeObjectInfo.object.address &&
            !$activeObjectInfo.object.city &&
            !$activeObjectInfo.object.country
        ) {
            void $objectAddress.refetch();
            activeObjectInfo.update(value => ({
                ...value,
                isLoading: true,
            }));
        }
    }

    function calculateStateStyles() {
        if (!marker?.content) {
            return;
        }

        const markerContent = marker.content as HTMLElement;

        // Remove existing classes first to avoid duplicates
        markerContent.classList.remove('opacity-50');

        // Add appropriate classes based on state
        if (isVisited) {
            const contrastingColor = getContrastingColor(color);
            // Apply border using box-shadow to avoid changing element size
            markerContent.style.boxShadow = `0 0 0 4px ${contrastingColor}`;
        } else {
            // Remove border when not visited
            markerContent.style.removeProperty('box-shadow');
        }
        if (isRemoved) {
            markerContent.classList.add('opacity-50');
        }
    }

    function getContrastingColor(categoryColor: string): string {
        const {h, s, l} = hexToHsl(categoryColor);

        // Default green color (emerald-500)
        const defaultGreen = '#10b981';
        const defaultGreenHsl = hexToHsl(defaultGreen);

        // Calculate color similarity (hue difference)
        const hueDifference = Math.abs(h - defaultGreenHsl.h);
        const normalizedHueDifference = Math.min(hueDifference, 360 - hueDifference) / 180; // 0-1 scale

        // If the category color is too similar to green (hue difference < 60 degrees), use a different color
        if (normalizedHueDifference < 0.33) {
            // 60 degrees / 180 = 0.33
            // Use a contrasting color that's not green
            if (s > 0.6) {
                // High saturation: use complementary hue in the safe lightness range
                const complementaryH = (h + 180) % 360;
                const safeLightness = l > 0.5 ? 0.25 : 0.75;
                return hslToHex(complementaryH, Math.min(s, 0.9), safeLightness);
            } else {
                // Low saturation: use high contrast but stay in visible zone
                if (l > 0.5) {
                    return '#2563eb'; // blue-600
                } else {
                    return '#f59e0b'; // amber-500
                }
            }
        }

        // Default to green for most cases
        return defaultGreen;
    }

    function hexToRgb(hex: string): {r: number; g: number; b: number} {
        let h = hex.replace('#', '');
        if (h.length === 3) {
            h = h
                .split('')
                .map(c => c + c)
                .join('');
        }
        const num = Number.parseInt(h, 16);
        return {
            r: (num >> 16) & 255,
            g: (num >> 8) & 255,
            b: num & 255,
        };
    }

    function hexToHsl(hex: string): {h: number; s: number; l: number} {
        const {r, g, b} = hexToRgb(hex);
        const rNorm = r / 255;
        const gNorm = g / 255;
        const bNorm = b / 255;

        const max = Math.max(rNorm, gNorm, bNorm);
        const min = Math.min(rNorm, gNorm, bNorm);
        const diff = max - min;

        let h = 0;
        let s = 0;
        const l = (max + min) / 2;

        if (diff !== 0) {
            s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);

            switch (max) {
                case rNorm:
                    h = ((gNorm - bNorm) / diff + (gNorm < bNorm ? 6 : 0)) / 6;
                    break;
                case gNorm:
                    h = ((bNorm - rNorm) / diff + 2) / 6;
                    break;
                case bNorm:
                    h = ((rNorm - gNorm) / diff + 4) / 6;
                    break;
            }
        }

        return {h: h * 360, s, l};
    }

    function hslToHex(h: number, s: number, l: number): string {
        const hNorm = h / 360;
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs(((hNorm * 6) % 2) - 1));
        const m = l - c / 2;

        let r = 0,
            g = 0,
            b = 0;

        if (0 <= hNorm && hNorm < 1 / 6) {
            r = c;
            g = x;
            b = 0;
        } else if (1 / 6 <= hNorm && hNorm < 2 / 6) {
            r = x;
            g = c;
            b = 0;
        } else if (2 / 6 <= hNorm && hNorm < 3 / 6) {
            r = 0;
            g = c;
            b = x;
        } else if (3 / 6 <= hNorm && hNorm < 4 / 6) {
            r = 0;
            g = x;
            b = c;
        } else if (4 / 6 <= hNorm && hNorm < 5 / 6) {
            r = x;
            g = 0;
            b = c;
        } else if (5 / 6 <= hNorm && hNorm < 1) {
            r = c;
            g = 0;
            b = x;
        }

        const rFinal = Math.round((r + m) * 255);
        const gFinal = Math.round((g + m) * 255);
        const bFinal = Math.round((b + m) * 255);

        return `#${rFinal.toString(16).padStart(2, '0')}${gFinal.toString(16).padStart(2, '0')}${bFinal.toString(16).padStart(2, '0')}`;
    }

    async function handleClickStart() {
        const {event} = await $mapLoader.importLibrary('core');

        mouseMoveListener = event.addListener(
            $map!,
            'mousemove',
            function (event: google.maps.MapMouseEvent) {
                isDragged = true;
                if (marker) {
                    marker.position = event.latLng;
                }
            },
        );

        setDraggable(false);
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
        skipClick = true;
    }

    async function handleClickEnd() {
        setDraggable(true);

        if (mouseMoveListener) {
            const {event} = await $mapLoader.importLibrary('core');
            event.removeListener(mouseMoveListener);
            mouseMoveListener = null;
        }

        if (isDragged) {
            isDragged = false;
            updateObjectCoordinates();
        }
    }

    onDestroy(() => {
        // Cleanup bounds listener
        if (boundsListener) {
            google.maps.event.removeListener(boundsListener);
        }

        if ($markerManager) {
            $markerManager.removeMarker(markerId!);
        }
    });

    function updateObjectCoordinates() {
        updateExistingObjectCoordinates();
    }

    async function updateExistingObjectCoordinates() {
        await $reposition.mutateAsync({
            id: id!,
            updatedFields: {
                lat: String(marker!.position!.lat),
                lng: String(marker!.position!.lng),
            },
        });
        pointList.updateCoordinates(
            id!,
            String(marker!.position!.lat),
            String(marker!.position!.lng),
        );
    }

    function handleMarkerClick() {
        if (skipClick) {
            skipClick = false;
            return;
        }

        changeActiveMarker();
    }

    function changeActiveMarker() {
        if (source === 'search' && $searchPointList[id!].object.id === null) {
            activeObjectInfo.set({
                isLoading: false,
                isEditing: false,
                isMinimized: false,
                isDirty: false,
                detailsId: id!,
                object: {...$searchPointList[id!].object, isVisited, isRemoved},
            });
        } else {
            if (!$objectDetails.isSuccess) {
                activeObjectInfo.set({
                    isLoading: true,
                    isEditing: false,
                    isMinimized: false,
                    isDirty: false,
                    detailsId: id!,
                    object: {id, lat, lng, isVisited, isRemoved},
                });
                $objectDetails.refetch();
            } else {
                activeObjectInfo.set({
                    isLoading: false,
                    isEditing: false,
                    isMinimized: false,
                    isDirty: false,
                    detailsId: $objectDetails.data.data.object.id,
                    object: $objectDetails.data.data.object,
                });
            }
        }

        activeMarker.set(marker!);
        activeMarker.activate();
    }
</script>
