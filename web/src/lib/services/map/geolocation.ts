import type {Location} from '$lib/interfaces/location';

export async function getInitialCenter(locationMutation: any): Promise<Location> {
    if (localStorage.getItem('lastCenter')) {
        return JSON.parse(localStorage.getItem('lastCenter') as string);
    }

    if (localStorage.getItem('lastPosition')) {
        return JSON.parse(localStorage.getItem('lastPosition') as string);
    }

    try {
        const result = await locationMutation.mutateAsync();
        return result.location ?? {lat: 0, lng: 0};
    } catch (e) {
        console.error('error getting location');
        console.error(e);
    }
    
    return {lat: 0, lng: 0};
}

export function startPositionPolling(intervalMs = 5000): number {
    updateCurrentPosition();
    const id = setInterval(updateCurrentPosition, intervalMs);
    return id;
}

export function stopPositionPolling(id?: number) {
    if (id) clearInterval(id);
}

function updateCurrentPosition() {
    navigator.permissions.query({name: 'geolocation'}).then(
        result => {
            if (result.state === 'granted' || result.state === 'prompt') {
                navigator.geolocation.getCurrentPosition(
                    position => {
                        const location = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude,
                            isCurrent: true,
                        };
                        localStorage.setItem('lastPosition', JSON.stringify(location));
                    },
                    error => {
                        console.error(error);
                        if (localStorage.getItem('lastPosition')) {
                            const location = JSON.parse(localStorage.getItem('lastPosition') as string);
                            location.isCurrent = false;
                            localStorage.setItem('lastPosition', JSON.stringify(location));
                        }
                    },
                    {enableHighAccuracy: false, timeout: 5000},
                );
            } else {
                console.error('geolocation is not granted, browser location services are disabled');
            }
        },
        error => {
            console.error('browser permission service unavailable');
            console.error(error);
        },
    );
}


