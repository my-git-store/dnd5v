<script setup lang="ts">
type Props = {
    tooltip: string
}

const props = defineProps<Props>()
</script>

<template>
    <span class="tooltip">
        <slot name="default" />
        <span class="tooltiptext">
            {{ props.tooltip }}
        </span>
    </span>
</template>

<style scoped>
.tooltip {
    position: relative;
    display: inline-block;
    cursor: pointer;
}

.tooltiptext {
    visibility: hidden;
    width: 130px;
    background-color: black;
    color: #ffffff;
    text-align: center;
    border-radius: 6px;
    padding: 5px 0;
    position: absolute;
    z-index: 9999;
    top: 100%;
    left: 65%;
    margin-left: -65px;
}

.tooltip:hover .tooltiptext {
    visibility: visible;
}
</style>