<script lang="ts">
</script>

<div class="container">
    <input type="text" placeholder="Искать..." />
</div>

<style lang="scss">
    @use '../../../styles/colors';
    @use '../../../styles/typography';

    .container {
        width: 100%;
        max-width: 384px;
    }

    input {
        @include typography.brand-face;
        @include typography.size-16;
        position: relative;
        width: 100%;
        height: 100%;
        padding: 10px 18px;
        border: none;
        border-radius: 40px;
        background-color: white;
        box-shadow: 0 0 2px colors.$transparentBlack;
    }
</style>
