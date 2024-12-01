<script lang="ts">
    import {fade, fly} from 'svelte/transition';
    import {cubicInOut} from 'svelte/easing';
    import {createMutation} from '@tanstack/svelte-query';
    import {logout} from '$lib/api/auth';
    import {invalidateToken} from '$lib/api/token';
    import RefreshToken from '$lib/api/auth/refreshToken';
    import Loader from '$lib/components/loader.svelte';
    import ImportDialog from '$lib/components/userMenu/import/importDialog.svelte';
    import {goto} from '$app/navigation';
    import {type Component} from 'svelte';
    import toast from 'svelte-french-toast';

    interface Props {
        onClose(): void;
    }

    let {onClose}: Props = $props();

    let isImportDialogOpen = $state(false);
    let isDialogOpen = $state(false);
    let isDialogLoading = $state(false);
    let PasswordChange: Component | undefined = $state();

    const invalidateTokenMutation = createMutation({
        mutationFn: invalidateToken,
        onSuccess() {
            RefreshToken.del();
            goto(`/login`);
        },
    });
    const logoutMutation = createMutation({
        mutationFn: logout,
        onSuccess: () => {
            $invalidateTokenMutation.mutate(RefreshToken.get() ?? '');
        },
    });

    async function handleChangePasswordClick() {
        isDialogOpen = true;
        if (!PasswordChange) {
            isDialogLoading = true;
            try {
                const {default: Component} = await import(
                    '$lib/components/userMenu/passwordChange.svelte'
                );
                PasswordChange = Component;
            } catch (error) {
                toast.error('Что-то пошло не так');
            }
            isDialogLoading = false;
        }
    }

    function handleImportClick() {
        isImportDialogOpen = true;
    }

    function handleLogoutClick() {
        $logoutMutation.mutate();
    }
</script>

<div class="backdrop" role="none" onclick={onClose}></div>
<div class="userMenu" transition:fly={{y: 32, duration: 200, easing: cubicInOut}}>
    <button class="userMenuButton" onclick={handleChangePasswordClick}>
        <i class="fa-solid fa-key"></i>
        Сменить пароль
    </button>
    <button class="userMenuButton" onclick={handleImportClick}>
        <i class="fa-solid fa-file-import"></i>
        Импорт точек
    </button>
    <button class="userMenuButton" onclick={handleLogoutClick}>
        <i class="fa-solid fa-sign-out-alt"></i>
        Выйти
    </button>
</div>

{#if isDialogLoading}
    <div class="loading" transition:fade={{duration: 200, easing: cubicInOut}}>
        <Loader />
    </div>
{/if}

{#if PasswordChange}
    <PasswordChange bind:isDialogOpen />
{/if}

<ImportDialog bind:isOpen={isImportDialogOpen} />

<style lang="scss">
    @use 'sass:color';
    @use '../../../styles/colors';
    @use '../../../styles/typography';

    .loading {
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        z-index: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.3);
    }

    .backdrop {
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        z-index: 1;
    }

    .userMenu {
        @include typography.brand-face;
        position: absolute;
        bottom: -8px;
        right: 0;
        transform: translateY(100%);
        border-radius: 10px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        z-index: 1;
    }

    .userMenuButton {
        @include typography.brand-face;
        @include typography.size-16;
        background: colors.$white;
        border: none;
        border-bottom: 1px solid colors.$lightgray;
        white-space: nowrap;
        padding: 8px 16px;
        transition: background-color 0.2s;
        text-align: left;
        color: colors.$black;
        cursor: pointer;

        &:disabled {
            background: colors.$lightgray;
            cursor: default;

            &:hover {
                background: colors.$lightgray;
            }
        }

        &:last-child {
            border: none;
        }

        & i {
            margin-right: 8px;
        }

        &:hover {
            background-color: color.scale(colors.$primary, $lightness: +80%);
        }
    }
</style>
