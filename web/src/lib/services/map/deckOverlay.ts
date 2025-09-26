import {deckEnabled} from '$lib/stores/map';

export type DeckItem = {
    id: string;
    position: [number, number];
    isVisited: boolean;
    isRemoved: boolean;
    isSearch: boolean;
};

export class DeckOverlayController {
    private map: google.maps.Map;
    private overlay: any | null = null;
    private ScatterplotLayerClass: any | null = null;
    private enabled = true;

    constructor(map: google.maps.Map) {
        this.map = map;
    }

    async init() {
        try {
            const [{GoogleMapsOverlay}, layers] = await Promise.all([
                // @ts-ignore - local ambient module declarations
                import('@deck.gl/google-maps'),
                // @ts-ignore - local ambient module declarations
                import('@deck.gl/layers'),
            ]);
            this.ScatterplotLayerClass = layers.ScatterplotLayer;
            this.overlay = new GoogleMapsOverlay({interleaved: false});
            this.overlay.setMap(this.map);
        } catch (e) {
            console.warn('Deck.gl overlay failed to initialize; continuing without it.', e);
        }
    }

    isReady(): boolean {
        return this.overlay && this.ScatterplotLayerClass;
    }

    setEnabled(enabled: boolean) {
        if (!this.isReady()) {
            return;
        }

        this.enabled = enabled;
        deckEnabled.set(enabled);

        if (!enabled) {
            this.overlay.setProps({layers: []});
        }
    }

    rebuild(items: DeckItem[]) {
        if (!this.enabled || !this.isReady()) {
            return;
        }

        const layer = new this.ScatterplotLayerClass({
            id: 'objects-layer',
            data: items,
            getPosition: (d: any) => d.position,
            radiusUnits: 'pixels',
            getRadius: 4,
            transitions: {getRadius: {duration: 100}},
            stroked: true,
            getFillColor: (d: any) => (d.isRemoved ? [0, 0, 0, 128] : [0, 0, 0, 255]),
            getLineColor: (d: any) => (d.isVisited ? [16, 185, 129, 255] : [0, 0, 0, 0]),
            getLineWidth: (d: any) => (d.isVisited ? 2 : 0),
            lineWidthUnits: 'pixels',
            parameters: {depthTest: false, depthMask: false},
        });
        this.overlay.setProps({layers: [layer]});
    }

    destroy() {
        if (this.overlay) {
            this.overlay.setProps({layers: []});
            try {
                this.overlay.setMap(null);
            } catch {}
        }
        this.overlay = null;
        this.ScatterplotLayerClass = null;
    }
}
