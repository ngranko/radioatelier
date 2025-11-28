<div class="absolute inset-0 overflow-hidden dark:hidden blur-[80px]">
    <div class="absolute rounded-full w-[500px] h-[500px] -top-[10%] -left-[10%] bg-primary opacity-[0.08]"></div>
    <div class="absolute rounded-full w-[600px] h-[600px] -bottom-[15%] -right-[15%] bg-primary opacity-[0.06]"></div>
    <div class="absolute rounded-full w-[350px] h-[350px] top-[35%] right-[5%] bg-primary opacity-[0.05]"></div>
</div>

<div class="absolute inset-0 overflow-hidden hidden dark:block">
    <div class="absolute rounded-full blur-3xl w-[300px] h-[300px] top-[5%] -left-[5%] bg-primary opacity-20"></div>
    <div class="absolute rounded-full blur-3xl w-[400px] h-[400px] -bottom-[10%] -right-[10%] bg-primary opacity-15"></div>
    <div class="absolute rounded-full blur-3xl w-[250px] h-[250px] top-[40%] right-[10%] bg-[oklch(0.75_0.15_200)] opacity-10"></div>

    <div class="absolute rounded-full blur-2xl w-20 h-20 top-[15%] right-[20%] bg-primary opacity-25"></div>
    <div class="absolute rounded-full blur-2xl w-[100px] h-[100px] bottom-[25%] left-[10%] bg-[oklch(0.75_0.15_85)] opacity-15"></div>
    <div class="absolute rounded-full blur-2xl w-[60px] h-[60px] top-[60%] left-[25%] bg-primary opacity-20"></div>

    <div class="absolute rounded-full blur-sm w-1.5 h-1.5 top-[25%] left-[15%] bg-white opacity-30"></div>
    <div class="absolute rounded-full blur-sm w-[5px] h-[5px] top-[35%] right-[30%] bg-white opacity-25"></div>
    <div class="absolute rounded-full blur-sm w-2 h-2 bottom-[35%] left-[35%] bg-primary opacity-40"></div>
    <div class="absolute rounded-full blur-sm w-1 h-1 top-[55%] right-[15%] bg-white opacity-30"></div>
    <div class="absolute rounded-full blur-sm w-1.5 h-1.5 bottom-[20%] right-[40%] bg-[oklch(0.8_0.12_85)] opacity-35"></div>
</div>

<svg class="absolute inset-0 w-full h-full z-[1]" preserveAspectRatio="xMidYMid slice" viewBox="0 0 100 100">
    <g>
        <path d="M-5 25 L30 25 Q35 25 38 28 L62 52 Q65 55 70 55 L105 55" fill="none" stroke="var(--primary)" stroke-width="0.3" opacity="0.15"/>
        <path d="M-5 45 L105 45" fill="none" stroke="var(--primary)" stroke-width="0.2" opacity="0.12"/>
        <path d="M-5 70 L25 70 Q30 70 32 72 L40 80 Q42 82 47 82 L105 82" fill="none" stroke="var(--primary)" stroke-width="0.25" opacity="0.14"/>
        <path d="M20 -5 L20 40 Q20 45 22 48 L28 55 Q30 58 30 63 L30 105" fill="none" stroke="var(--primary)" stroke-width="0.2" opacity="0.12"/>
        <path d="M50 -5 L50 105" fill="none" stroke="var(--primary)" stroke-width="0.15" opacity="0.1"/>
        <path d="M75 -5 L75 30 Q75 35 72 38 L65 45 Q62 48 62 53 L62 105" fill="none" stroke="var(--primary)" stroke-width="0.2" opacity="0.12"/>
        <path d="M-5 15 L40 60 Q43 63 48 63 L105 63" fill="none" stroke="var(--primary)" stroke-width="0.15" opacity="0.1"/>

        <circle cx="20" cy="25" r="1.2" fill="var(--primary)" opacity="0.5" filter="url(#glow-login)"/>
        <circle cx="50" cy="45" r="1.5" fill="var(--primary)" opacity="0.6" filter="url(#glow-login)"/>
        <circle cx="75" cy="45" r="1" fill="var(--primary)" opacity="0.45" filter="url(#glow-login)"/>
        <circle cx="30" cy="70" r="1.2" fill="var(--primary)" opacity="0.5" filter="url(#glow-login)"/>
        <circle cx="62" cy="82" r="0.9" fill="var(--primary)" opacity="0.4" filter="url(#glow-login)"/>
        <circle cx="20" cy="45" r="0.8" fill="var(--primary)" opacity="0.35" filter="url(#glow-login)"/>
    </g>
    
    
    <defs>
        <filter id="glow-login" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="1" result="blur"/>
            <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
        </filter>
    </defs>
</svg>