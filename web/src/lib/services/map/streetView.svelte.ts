import {activeObjectInfo, map} from '$lib/stores/map';

export function getStreetView(lat: number, lng: number) {
    const streetView = new google.maps.StreetViewService();
    return streetView
        .getPanorama({
            location: new google.maps.LatLng(lat, lng),
            radius: 30,
        })
        .then(({data}: google.maps.StreetViewResponse) => {
            map.subscribe(value => {
                const location = data.location!;
                if (value) {
                    const pano = value.getStreetView();
                    pano.setPano(location.pano as string);
                    pano.setVisible(true);
                    activeObjectInfo.update(value => ({...value, isMinimized: true}));
                }
            });
        });
}