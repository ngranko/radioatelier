<button class="close" on:click>
    <i class="fa-solid fa-xmark"></i>
</button>

<style lang="scss">
    @use '../../../styles/colors';

    .close {
        width: 26px;
        height: 26px;
        border: 0;
        padding: 0;
        margin: 0;
        background: none;
        font-size: 26px;
        color: colors.$black;
        cursor: pointer;
        transition: 0.2s;

        &:hover {
            color: colors.$primary;
        }

        & i {
            display: block;
        }
    }
</style>
