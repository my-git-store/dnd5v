<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { diceLabel, dieFaceLabel, type DiceSides } from '../../domain/dice'
import { diceAssetFor } from './diceAssets'

const props = defineProps<{
    sides: DiceSides
    result: number | null
    rolling: boolean
}>()

const assetSource = ref(diceAssetFor(props.sides))

watch(
    () => props.sides,
    sides => {
        assetSource.value = diceAssetFor(sides)
    },
)

const faceLabel = computed(() => dieFaceLabel(props.sides, props.result))

const visualLabel = computed(
    () => `${diceLabel(props.sides)}${props.result === null ? '' : `, результат ${props.result}`}`,
)

function useFallback() {
    assetSource.value = undefined
}
</script>

<template>
    <div
        class="flex flex-col items-center gap-2"
        role="img"
        :aria-label="visualLabel"
        :aria-busy="props.rolling"
    >
        <img
            v-if="assetSource"
            :key="props.sides"
            class="h-24 w-24 object-contain"
            :src="assetSource"
            alt=""
            @error="useFallback"
        />
        <strong v-if="props.result !== null && !props.rolling">{{ faceLabel }}</strong>
        <small>{{ diceLabel(props.sides) }}</small>
    </div>
</template>
