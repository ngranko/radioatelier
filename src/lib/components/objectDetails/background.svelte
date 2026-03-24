<script lang="ts">
    import {mapState} from '$lib/state/map.svelte';
    import {
        Root as DialogRoot,
        Trigger,
        Content,
        Header,
        Title,
        Description,
        Footer,
        Close,
    } from '$lib/components/ui/dialog';
    import {Button} from '$lib/components/ui/button';

    interface Props {
        isConfirmationRequired?: boolean;
        onClick(): void;
    }

    let {isConfirmationRequired = false, onClick}: Props = $props();
</script>

{#if isConfirmationRequired}
    <DialogRoot>
        <Trigger
            class={`fixed inset-0 z-1 bg-transparent ${
                mapState.streetViewVisible ? 'pointer-events-none' : ''
            }`}
        ></Trigger>
        <Content>
            <Header>
                <Title>Вы действительно хотите выйти из редактирования точки?</Title>
                <Description>Изменения не будут сохранены</Description>
            </Header>
            <Footer>
                <Close>
                    <Button variant="ghost">Отменить</Button>
                </Close>
                <Button
                    variant="ghost"
                    class="text-destructive hover:text-destructive"
                    onclick={onClick}
                >
                    Закрыть
                </Button>
            </Footer>
        </Content>
    </DialogRoot>
{:else}
    <button
        type="button"
        aria-label="Close object details"
        class="fixed inset-0 z-1 bg-transparent"
        class:pointer-events-none={mapState.streetViewVisible}
        onclick={onClick}
    ></button>
{/if}
