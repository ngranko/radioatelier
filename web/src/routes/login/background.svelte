<div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
    <!-- Base wash -->
    <div
        class="absolute inset-0 opacity-90 dark:opacity-70 bg-[linear-gradient(135deg,var(--muted),var(--background)_42%,var(--muted))]"
    ></div>

    <!-- Mesh / blobs (stronger so it’s not too subtle) -->
    <div
        class="absolute -inset-[20%] blur-[56px] mix-blend-multiply dark:mix-blend-screen [background:radial-gradient(700px_circle_at_12%_18%,oklch(0.65_0.18_265_/_0.26),transparent_60%),radial-gradient(900px_circle_at_88%_82%,oklch(0.72_0.16_200_/_0.22),transparent_58%)] dark:[background:radial-gradient(650px_circle_at_15%_15%,oklch(0.72_0.18_265_/_0.30),transparent_56%),radial-gradient(900px_circle_at_85%_85%,oklch(0.78_0.16_200_/_0.22),transparent_55%)]"
    ></div>

    <!-- Grain -->
    <div
        class="absolute inset-0 opacity-[0.085] dark:opacity-[0.095] mix-blend-overlay dark:mix-blend-soft-light bg-[repeating-radial-gradient(circle_at_0_0,rgba(255,255,255,0.75)_0,rgba(255,255,255,0.75)_0.7px,transparent_0.7px,transparent_3.6px)] [background-size:8px_8px]"
    ></div>

    <!-- Vignette -->
    <div
        class="absolute -inset-[10%] opacity-55 dark:opacity-75 bg-[radial-gradient(closest-side_at_50%_50%,transparent_0%,rgba(0,0,0,0.16)_100%)] dark:bg-[radial-gradient(closest-side_at_50%_50%,transparent_0%,rgba(0,0,0,0.4)_100%)]"
    ></div>

    <!-- Street-grid overlay -->
    <svg
        class="absolute inset-0 z-[1] h-full w-full opacity-100 dark:opacity-80 [mask-image:radial-gradient(circle_at_50%_50%,black_0%,transparent_68%)] [-webkit-mask-image:radial-gradient(circle_at_50%_50%,black_0%,transparent_68%)]"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 100 100"
        focusable="false"
    >
        <!-- Blocks / streets -->
        <g stroke="var(--primary)" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <!-- Major arterials (curvier + less “perfect grid”) -->
            <g opacity="0.18">
                <path d="M-5 28 H26 Q32 28 36 24 L46 14 Q50 10 56 10 H105" stroke-width="0.36" />
                <path d="M-5 66 H22 Q28 66 32 70 L42 80 Q46 84 52 84 H105" stroke-width="0.34" />
                <path
                    d="M16 -5 V26 Q16 32 20 36 L30 46 Q34 50 34 56 V105"
                    stroke-width="0.32"
                    opacity="0.9"
                />
                <path
                    d="M84 -5 V20 Q84 26 80 30 L70 40 Q66 44 66 50 V105"
                    stroke-width="0.32"
                    opacity="0.9"
                />
                <!-- Diagonal “avenue” -->
                <path
                    d="M-5 12 L18 28 Q26 34 34 34 H48 Q54 34 60 40 L74 54 Q82 62 92 62 H105"
                    stroke-width="0.34"
                    opacity="0.85"
                />
            </g>

            <!-- Roundabouts / plazas (map-like landmarks) -->
            <g opacity="0.14" stroke-width="0.22">
                <circle cx="34" cy="34" r="2.8" />
            </g>

            <!-- Secondary streets -->
            <g opacity="0.14" stroke-width="0.2">
                <path d="M-5 42 H20 Q26 42 30 46 L36 52 Q40 56 46 56 H105" />
                <path
                    d="M52 -5 V18 Q52 24 48 28 L44 32 Q40 36 40 42 V62 Q40 68 44 72 L50 78 Q54 82 54 88 V105"
                />
                <path d="M-5 84 H28 Q36 84 42 78 L48 72 Q54 66 62 66 H105" />
            </g>

            <!-- Local streets (denser, but with gaps/stubs like real blocks) -->
            <g opacity="0.12" stroke-width="0.18">
                <!-- horizontals -->
                <path d="M-5 18 H22 M28 18 H54 M62 18 H105" />
                <path d="M-5 24 H14 M20 24 H40 M48 24 H78 M86 24 H105" />
                <path d="M-5 30 H16 M24 30 H44 M52 30 H76 M84 30 H105" />
                <path d="M-5 36 H30 M38 36 H58 M66 36 H105" />
                <path d="M-5 48 H18 M26 48 H42 M50 48 H72 M80 48 H105" />
                <path d="M-5 54 H12 M18 54 H36 M44 54 H62 M70 54 H105" />
                <path d="M-5 72 H20 M28 72 H46 M54 72 H76 M84 72 H105" />
                <path d="M-5 78 H26 M34 78 H52 M60 78 H82 M90 78 H105" />
                <path d="M-5 90 H18 M26 90 H44 M52 90 H70 M78 90 H105" />

                <!-- verticals -->
                <path d="M10 -5 V22 M10 30 V54 M10 62 V105" />
                <path d="M22 -5 V14 M22 22 V46 M22 54 V76 M22 84 V105" />
                <path d="M30 -5 V26 M30 34 V58 M30 66 V105" />
                <path d="M38 -5 V18 M38 26 V40 M38 48 V70 M38 78 V105" />
                <path d="M46 -5 V30 M46 38 V64 M46 72 V105" />
                <path d="M58 -5 V16 M58 24 V44 M58 52 V74 M58 82 V105" />
                <path d="M70 -5 V22 M70 30 V56 M70 64 V105" />
                <path d="M78 -5 V12 M78 20 V40 M78 48 V76 M78 84 V105" />
                <path d="M90 -5 V34 M90 42 V62 M90 70 V105" />

                <!-- cul-de-sacs / stubs -->
                <path d="M14 60 H18" />
                <path d="M62 60 H66" />
                <path d="M74 58 V62" />
                <path d="M34 12 V16" />
            </g>

            <!-- A few block outlines -->
            <g opacity="0.08" stroke-width="0.18">
                <rect x="24" y="44" width="12" height="10" rx="1" />
                <rect x="48" y="22" width="14" height="10" rx="1" />
                <rect x="62" y="44" width="16" height="10" rx="1" />
                <rect x="40" y="74" width="12" height="10" rx="1" />
            </g>
        </g>

        <!-- Markers (map-like pins) -->
        <g filter="url(#glow-login)">
            <g transform="translate(34 28) scale(0.42)" opacity="0.9">
                <path
                    d="M0 -3.4 C-1.55 -3.4 -2.7 -2.25 -2.7 -0.8 C-2.7 1.0 -1.35 2.15 -0.55 3.05 C-0.25 3.4 0 3.8 0 3.8 C0 3.8 0.25 3.4 0.55 3.05 C1.35 2.15 2.7 1.0 2.7 -0.8 C2.7 -2.25 1.55 -3.4 0 -3.4 Z"
                    fill="var(--primary)"
                    opacity="0.22"
                />
                <path
                    d="M0 -3.4 C-1.55 -3.4 -2.7 -2.25 -2.7 -0.8 C-2.7 1.0 -1.35 2.15 -0.55 3.05 C-0.25 3.4 0 3.8 0 3.8 C0 3.8 0.25 3.4 0.55 3.05 C1.35 2.15 2.7 1.0 2.7 -0.8 C2.7 -2.25 1.55 -3.4 0 -3.4 Z"
                    fill="none"
                    stroke="var(--primary)"
                    stroke-width="0.28"
                    opacity="0.55"
                />
                <circle cx="0" cy="-0.9" r="0.7" fill="var(--primary)" opacity="0.8" />
            </g>

            <g transform="translate(66 44) scale(0.4)" opacity="0.85">
                <path
                    d="M0 -3.6 C-1.65 -3.6 -2.85 -2.4 -2.85 -0.9 C-2.85 1.0 -1.45 2.2 -0.6 3.15 C-0.25 3.55 0 3.95 0 3.95 C0 3.95 0.25 3.55 0.6 3.15 C1.45 2.2 2.85 1.0 2.85 -0.9 C2.85 -2.4 1.65 -3.6 0 -3.6 Z"
                    fill="var(--primary)"
                    opacity="0.2"
                />
                <path
                    d="M0 -3.6 C-1.65 -3.6 -2.85 -2.4 -2.85 -0.9 C-2.85 1.0 -1.45 2.2 -0.6 3.15 C-0.25 3.55 0 3.95 0 3.95 C0 3.95 0.25 3.55 0.6 3.15 C1.45 2.2 2.85 1.0 2.85 -0.9 C2.85 -2.4 1.65 -3.6 0 -3.6 Z"
                    fill="none"
                    stroke="var(--primary)"
                    stroke-width="0.28"
                    opacity="0.52"
                />
                <circle cx="0" cy="-1" r="0.74" fill="var(--primary)" opacity="0.78" />
            </g>

            <g transform="translate(50 72) scale(0.42)" opacity="0.8">
                <path
                    d="M0 -3.3 C-1.5 -3.3 -2.6 -2.2 -2.6 -0.8 C-2.6 0.95 -1.3 2.05 -0.55 2.9 C-0.25 3.25 0 3.6 0 3.6 C0 3.6 0.25 3.25 0.55 2.9 C1.3 2.05 2.6 0.95 2.6 -0.8 C2.6 -2.2 1.5 -3.3 0 -3.3 Z"
                    fill="var(--primary)"
                    opacity="0.2"
                />
                <path
                    d="M0 -3.3 C-1.5 -3.3 -2.6 -2.2 -2.6 -0.8 C-2.6 0.95 -1.3 2.05 -0.55 2.9 C-0.25 3.25 0 3.6 0 3.6 C0 3.6 0.25 3.25 0.55 2.9 C1.3 2.05 2.6 0.95 2.6 -0.8 C2.6 -2.2 1.5 -3.3 0 -3.3 Z"
                    fill="none"
                    stroke="var(--primary)"
                    stroke-width="0.28"
                    opacity="0.5"
                />
                <circle cx="0" cy="-0.85" r="0.68" fill="var(--primary)" opacity="0.74" />
            </g>
        </g>

        <defs>
            <filter id="glow-login" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="1" result="blur" />
                <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>
    </svg>
</div>
