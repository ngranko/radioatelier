<script lang="ts">
    import type {Component} from 'svelte';
    import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';

    import ZapIcon from '@lucide/svelte/icons/zap';
    import RadioIcon from '@lucide/svelte/icons/radio';
    import StarIcon from '@lucide/svelte/icons/star';
    import HeartIcon from '@lucide/svelte/icons/heart';
    import MusicIcon from '@lucide/svelte/icons/music';
    import BeerIcon from '@lucide/svelte/icons/beer';
    import FlameIcon from '@lucide/svelte/icons/flame';
    import SparklesIcon from '@lucide/svelte/icons/sparkles';
    import LightbulbIcon from '@lucide/svelte/icons/lightbulb';
    import CameraIcon from '@lucide/svelte/icons/camera';

    import CoffeeIcon from '@lucide/svelte/icons/coffee';
    import MicIcon from '@lucide/svelte/icons/mic';
    import GuitarIcon from '@lucide/svelte/icons/guitar';
    import PizzaIcon from '@lucide/svelte/icons/pizza';
    import GemIcon from '@lucide/svelte/icons/gem';
    import CrownIcon from '@lucide/svelte/icons/crown';
    import CompassIcon from '@lucide/svelte/icons/compass';
    import MapPinIcon from '@lucide/svelte/icons/map-pin';
    import HeadphonesIcon from '@lucide/svelte/icons/headphones';
    import ClapperboardIcon from '@lucide/svelte/icons/clapperboard';

    import ScissorsIcon from '@lucide/svelte/icons/scissors';
    import MartiniIcon from '@lucide/svelte/icons/martini';
    import Building2Icon from '@lucide/svelte/icons/building-2';
    import StoreIcon from '@lucide/svelte/icons/store';
    import PaletteIcon from '@lucide/svelte/icons/palette';
    import BookOpenIcon from '@lucide/svelte/icons/book-open';
    import WrenchIcon from '@lucide/svelte/icons/wrench';
    import KeyRoundIcon from '@lucide/svelte/icons/key-round';
    import AnchorIcon from '@lucide/svelte/icons/anchor';
    import UmbrellaIcon from '@lucide/svelte/icons/umbrella';

    import ClockIcon from '@lucide/svelte/icons/clock';
    import EyeIcon from '@lucide/svelte/icons/eye';
    import GlobeIcon from '@lucide/svelte/icons/globe';
    import Flower2Icon from '@lucide/svelte/icons/flower-2';
    import GiftIcon from '@lucide/svelte/icons/gift';
    import ShieldIcon from '@lucide/svelte/icons/shield';
    import TagIcon from '@lucide/svelte/icons/tag';
    import BookmarkIcon from '@lucide/svelte/icons/bookmark';
    import BellIcon from '@lucide/svelte/icons/bell';
    import FlagIcon from '@lucide/svelte/icons/flag';

    import CalculatorIcon from '@lucide/svelte/icons/calculator';
    import BriefcaseIcon from '@lucide/svelte/icons/briefcase';
    import TruckIcon from '@lucide/svelte/icons/truck';
    import HardDriveIcon from '@lucide/svelte/icons/hard-drive';
    import PrinterIcon from '@lucide/svelte/icons/printer';
    import FileTextIcon from '@lucide/svelte/icons/file-text';
    import CalendarIcon from '@lucide/svelte/icons/calendar';
    import ClipboardIcon from '@lucide/svelte/icons/clipboard';
    import ArchiveIcon from '@lucide/svelte/icons/archive';
    import DatabaseIcon from '@lucide/svelte/icons/database';

    interface ColorEntry {
        name: string;
        oklch: string;
        hex: string;
    }

    interface IconEntry {
        name: string;
        component: Component<{class?: string}>;
    }

    interface Tier {
        name: string;
        label: string;
        confidence: number;
    }

    const tiers: Tier[] = [
        {name: 'Neon Classics', label: 'Perfect', confidence: 5},
        {name: 'Neon Vibes', label: 'Great', confidence: 4},
        {name: 'Glow Extended', label: 'Good', confidence: 3},
        {name: 'Soft Neon', label: 'Acceptable', confidence: 2},
        {name: 'Edge Cases', label: 'Doubtful', confidence: 1},
    ];

    const colorTiers: ColorEntry[][] = [
        [
            {name: 'Hot Pink', oklch: 'oklch(0.65 0.28 350)', hex: '#ff2d8a'},
            {name: 'Electric Cyan', oklch: 'oklch(0.75 0.18 195)', hex: '#00c2d1'},
            {name: 'Neon Red', oklch: 'oklch(0.60 0.26 25)', hex: '#e63b2e'},
            {name: 'Amber Glow', oklch: 'oklch(0.82 0.19 85)', hex: '#e6a817'},
            {name: 'Turquoise', oklch: 'oklch(0.72 0.15 180)', hex: '#00b3a4'},
        ],
        [
            {name: 'Violet', oklch: 'oklch(0.55 0.27 300)', hex: '#8b2fc6'},
            {name: 'Sapphire', oklch: 'oklch(0.55 0.22 260)', hex: '#4158cc'},
            {name: 'Lime', oklch: 'oklch(0.82 0.24 135)', hex: '#7dd621'},
            {name: 'Rose', oklch: 'oklch(0.68 0.22 10)', hex: '#e54f6d'},
            {name: 'Lemon', oklch: 'oklch(0.90 0.18 105)', hex: '#cdd020'},
        ],
        [
            {name: 'Indigo', oklch: 'oklch(0.50 0.22 275)', hex: '#5b47c9'},
            {name: 'Chartreuse', oklch: 'oklch(0.82 0.18 118)', hex: '#93c43a'},
            {name: 'Bronze', oklch: 'oklch(0.58 0.12 60)', hex: '#9a7445'},
            {name: 'Powder Blue', oklch: 'oklch(0.75 0.10 240)', hex: '#85a8d2'},
            {name: 'Sky', oklch: 'oklch(0.75 0.14 230)', hex: '#5aade0'},
        ],
        [
            {name: 'Mauve', oklch: 'oklch(0.62 0.12 325)', hex: '#a86898'},
            {name: 'Peach', oklch: 'oklch(0.78 0.14 50)', hex: '#e8a77d'},
            {name: 'Sand', oklch: 'oklch(0.75 0.07 75)', hex: '#c4ac88'},
            {name: 'Warm White', oklch: 'oklch(0.92 0.05 80)', hex: '#f0e4c8'},
            {name: 'Steel', oklch: 'oklch(0.60 0.06 250)', hex: '#7580a0'},
        ],
        [
            {name: 'Olive', oklch: 'oklch(0.62 0.12 120)', hex: '#7a8c3b'},
            {name: 'Rust', oklch: 'oklch(0.55 0.16 50)', hex: '#a8643b'},
            {name: 'Slate', oklch: 'oklch(0.55 0.04 260)', hex: '#6b7280'},
            {name: 'Khaki', oklch: 'oklch(0.68 0.08 100)', hex: '#9a9460'},
            {name: 'Espresso', oklch: 'oklch(0.32 0.06 45)', hex: '#3e3028'},
        ],
    ];

    const iconTiers: IconEntry[][] = [
        [
            {name: 'Zap', component: ZapIcon},
            {name: 'Radio', component: RadioIcon},
            {name: 'Star', component: StarIcon},
            {name: 'Heart', component: HeartIcon},
            {name: 'Music', component: MusicIcon},
            {name: 'Beer', component: BeerIcon},
            {name: 'Flame', component: FlameIcon},
            {name: 'Sparkles', component: SparklesIcon},
            {name: 'Lightbulb', component: LightbulbIcon},
            {name: 'Camera', component: CameraIcon},
        ],
        [
            {name: 'Coffee', component: CoffeeIcon},
            {name: 'Mic', component: MicIcon},
            {name: 'Guitar', component: GuitarIcon},
            {name: 'Pizza', component: PizzaIcon},
            {name: 'Gem', component: GemIcon},
            {name: 'Crown', component: CrownIcon},
            {name: 'Compass', component: CompassIcon},
            {name: 'Map Pin', component: MapPinIcon},
            {name: 'Headphones', component: HeadphonesIcon},
            {name: 'Clapperboard', component: ClapperboardIcon},
        ],
        [
            {name: 'Scissors', component: ScissorsIcon},
            {name: 'Martini', component: MartiniIcon},
            {name: 'Building', component: Building2Icon},
            {name: 'Store', component: StoreIcon},
            {name: 'Palette', component: PaletteIcon},
            {name: 'Book', component: BookOpenIcon},
            {name: 'Wrench', component: WrenchIcon},
            {name: 'Key', component: KeyRoundIcon},
            {name: 'Anchor', component: AnchorIcon},
            {name: 'Umbrella', component: UmbrellaIcon},
        ],
        [
            {name: 'Clock', component: ClockIcon},
            {name: 'Eye', component: EyeIcon},
            {name: 'Globe', component: GlobeIcon},
            {name: 'Flower', component: Flower2Icon},
            {name: 'Gift', component: GiftIcon},
            {name: 'Shield', component: ShieldIcon},
            {name: 'Tag', component: TagIcon},
            {name: 'Bookmark', component: BookmarkIcon},
            {name: 'Bell', component: BellIcon},
            {name: 'Flag', component: FlagIcon},
        ],
        [
            {name: 'Calculator', component: CalculatorIcon},
            {name: 'Briefcase', component: BriefcaseIcon},
            {name: 'Truck', component: TruckIcon},
            {name: 'Hard Drive', component: HardDriveIcon},
            {name: 'Printer', component: PrinterIcon},
            {name: 'File', component: FileTextIcon},
            {name: 'Calendar', component: CalendarIcon},
            {name: 'Clipboard', component: ClipboardIcon},
            {name: 'Archive', component: ArchiveIcon},
            {name: 'Database', component: DatabaseIcon},
        ],
    ];

    let selectedColor: ColorEntry = $state(colorTiers[0][0]);
    let selectedIcon: IconEntry = $state(iconTiers[0][0]);

    const confidenceBars = $derived(
        tiers.map(t => ({
            filled: t.confidence,
            empty: 5 - t.confidence,
        })),
    );

    function selectColor(color: ColorEntry) {
        selectedColor = color;
    }

    function selectIcon(icon: IconEntry) {
        selectedIcon = icon;
    }

    function needsDarkText(hex: string): boolean {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.75;
    }
</script>

<svelte:head>
    <title>Marker Kit — Radioatelier</title>
</svelte:head>

<div class="showcase-page font-branding min-h-screen bg-[#0a0a12] text-white">
    <div
        class="pointer-events-none fixed inset-0 z-0"
        style="background: radial-gradient(ellipse at 20% 0%, {selectedColor.oklch} / 8%, transparent 60%),
               radial-gradient(ellipse at 80% 100%, oklch(0.55 0.18 195) / 5%, transparent 50%)"
    ></div>

    <div class="relative z-10">
        <header class="px-6 pt-6 pb-4 md:px-10 md:pt-10">
            <a
                href="/"
                class="group mb-8 inline-flex items-center gap-2 text-sm text-white/40 transition-colors hover:text-white/80"
            >
                <ArrowLeftIcon class="size-4 transition-transform group-hover:-translate-x-0.5" />
                Back to Archive
            </a>
            <div class="mb-2 flex items-center gap-3">
                <div
                    class="flex h-8 w-8 items-center justify-center rounded-full"
                    style="background-color: {selectedColor.hex};
                           box-shadow: 0 0 20px {selectedColor.hex}80, 0 0 40px {selectedColor.hex}40"
                >
                    <selectedIcon.component class="size-4 text-white" />
                </div>
                <h1 class="text-3xl font-bold tracking-tight md:text-4xl">
                    Marker Customization Kit
                </h1>
            </div>
            <p class="max-w-xl text-base text-white/50">
                Colors and icons for map markers, ranked by how well they match the neon sign
                aesthetic of the archive.
            </p>
        </header>

        <div
            class="sticky top-0 z-30 border-b border-white/[0.06] bg-[#0a0a12]/80 px-6 py-4 backdrop-blur-xl md:px-10"
        >
            <div class="flex items-center gap-5">
                <span class="text-xs tracking-widest text-white/30 uppercase">Preview</span>

                <div class="flex items-center gap-4">
                    <div
                        class="flex h-6 w-6 items-center justify-center rounded-full text-white transition-all duration-300"
                        style="background-color: {selectedColor.hex};
                               box-shadow: 0 0 0 2px white, 0 0 0 4px {selectedColor.hex}40, 0 1px 3px rgba(0,0,0,0.2)"
                    >
                        <selectedIcon.component class="size-3.5" />
                    </div>

                    <div
                        class="flex h-10 w-10 items-center justify-center rounded-full text-white transition-all duration-300"
                        style="background-color: {selectedColor.hex};
                               box-shadow: 0 0 0 3px white, 0 0 0 6px {selectedColor.hex}40, 0 0 24px {selectedColor.hex}60, 0 2px 8px rgba(0,0,0,0.3)"
                    >
                        <selectedIcon.component class="size-5" />
                    </div>

                    <div
                        class="flex h-14 w-14 items-center justify-center rounded-full text-white transition-all duration-300"
                        style="background-color: {selectedColor.hex};
                               box-shadow: 0 0 0 3px white, 0 0 0 6px {selectedColor.hex}40, 0 0 30px {selectedColor.hex}50, 0 0 60px {selectedColor.hex}25, 0 4px 12px rgba(0,0,0,0.3)"
                    >
                        <selectedIcon.component class="size-7" />
                    </div>
                </div>

                <div class="ml-2 flex flex-col">
                    <span class="text-sm font-medium text-white/90">
                        {selectedColor.name} + {selectedIcon.name}
                    </span>
                    <span class="font-mono text-xs text-white/30">
                        {selectedColor.oklch}
                    </span>
                </div>
            </div>
        </div>

        <div class="grid gap-8 px-6 py-8 md:grid-cols-2 md:px-10 md:py-10">
            <section>
                <h2 class="mb-5 text-lg font-semibold tracking-tight text-white/70">
                    Color Palette
                </h2>
                <div class="flex flex-col gap-4">
                    {#each tiers as tier, tierIndex (tier.name)}
                        <div
                            class="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-sm"
                        >
                            <div class="mb-4 flex items-center justify-between">
                                <div>
                                    <h3 class="text-sm font-semibold text-white/90">
                                        {tier.name}
                                    </h3>
                                    <span class="text-xs text-white/35">{tier.label} match</span>
                                </div>
                                <div class="flex gap-1">
                                    {#each Array(confidenceBars[tierIndex].filled) as _, i (i)}
                                        <div class="h-1.5 w-3 rounded-full bg-white/60"></div>
                                    {/each}
                                    {#each Array(confidenceBars[tierIndex].empty) as _, i (i)}
                                        <div class="h-1.5 w-3 rounded-full bg-white/10"></div>
                                    {/each}
                                </div>
                            </div>

                            <div class="flex flex-wrap gap-3">
                                {#each colorTiers[tierIndex] as color (color.hex)}
                                    {@const isSelected = selectedColor.hex === color.hex}
                                    <button
                                        onclick={() => selectColor(color)}
                                        class="group flex flex-col items-center gap-2"
                                    >
                                        <div
                                            class="flex h-11 w-11 items-center justify-center rounded-full transition-all duration-200 {isSelected
                                                ? 'scale-110'
                                                : 'hover:scale-105'}"
                                            style="background-color: {color.hex};
                                                   box-shadow: {isSelected
                                                ? `0 0 0 2px #0a0a12, 0 0 0 4px ${color.hex}, 0 0 20px ${color.hex}80`
                                                : `0 0 12px ${color.hex}30`}"
                                        >
                                            <selectedIcon.component
                                                class="size-4 text-white {isSelected
                                                    ? 'opacity-100'
                                                    : 'opacity-0 group-hover:opacity-60'} transition-opacity duration-150 {needsDarkText(
                                                    color.hex,
                                                )
                                                    ? '!text-black/70'
                                                    : ''}"
                                            />
                                        </div>
                                        <span
                                            class="max-w-12 truncate text-center text-[10px] leading-tight {isSelected
                                                ? 'text-white/80'
                                                : 'text-white/30'} transition-colors"
                                        >
                                            {color.name}
                                        </span>
                                    </button>
                                {/each}
                            </div>
                        </div>
                    {/each}
                </div>
            </section>

            <section>
                <h2 class="mb-5 text-lg font-semibold tracking-tight text-white/70">Icon Set</h2>
                <div class="flex flex-col gap-4">
                    {#each tiers as tier, tierIndex (tier.name)}
                        <div
                            class="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 backdrop-blur-sm"
                        >
                            <div class="mb-4 flex items-center justify-between">
                                <div>
                                    <h3 class="text-sm font-semibold text-white/90">
                                        {tier.name}
                                    </h3>
                                    <span class="text-xs text-white/35">{tier.label} match</span>
                                </div>
                                <div class="flex gap-1">
                                    {#each Array(confidenceBars[tierIndex].filled) as _, i (i)}
                                        <div class="h-1.5 w-3 rounded-full bg-white/60"></div>
                                    {/each}
                                    {#each Array(confidenceBars[tierIndex].empty) as _, i (i)}
                                        <div class="h-1.5 w-3 rounded-full bg-white/10"></div>
                                    {/each}
                                </div>
                            </div>

                            <div class="flex flex-wrap gap-2">
                                {#each iconTiers[tierIndex] as icon (icon.name)}
                                    {@const isSelected = selectedIcon.name === icon.name}
                                    <button
                                        onclick={() => selectIcon(icon)}
                                        class="group flex flex-col items-center gap-1.5"
                                    >
                                        <div
                                            class="flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 {isSelected
                                                ? 'scale-110 bg-white/15'
                                                : 'bg-white/[0.04] hover:bg-white/[0.08]'}"
                                            style={isSelected
                                                ? `box-shadow: 0 0 0 1.5px ${selectedColor.hex}80, 0 0 12px ${selectedColor.hex}30`
                                                : ''}
                                        >
                                            <icon.component
                                                class="size-[18px] transition-colors duration-150 {isSelected
                                                    ? 'text-white'
                                                    : 'text-white/40 group-hover:text-white/70'}"
                                            />
                                        </div>
                                        <span
                                            class="max-w-10 truncate text-center text-[10px] leading-tight {isSelected
                                                ? 'text-white/80'
                                                : 'text-white/25'} transition-colors"
                                        >
                                            {icon.name}
                                        </span>
                                    </button>
                                {/each}
                            </div>
                        </div>
                    {/each}
                </div>
            </section>
        </div>
    </div>
</div>
