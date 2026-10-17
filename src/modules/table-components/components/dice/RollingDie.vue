<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { diceLabel, dieFaceLabel, type DiceSides } from '../../domain/dice.ts'
import { diceAssetFor } from './diceAssets.ts'

const props = defineProps<{
  sides: DiceSides
  result: number | null
  rolling: boolean
}>()

const assetSource = ref(diceAssetFor(props.sides))

watch(() => props.sides, (sides) => {
  assetSource.value = diceAssetFor(sides)
})

const state = computed(() => {
  if (props.rolling) return 'rolling'
  return props.result === null ? 'idle' : 'landed'
})

const faceLabel = computed(() => dieFaceLabel(props.sides, props.result))
const visualLabel = computed(() => `${diceLabel(props.sides)}${props.result === null ? '' : `, результат ${props.result}`}`)

function useFallback() {
  assetSource.value = undefined
}
</script>

<template>
  <div class="rolling-die" :class="`rolling-die--${state}`" :data-shape="`d${props.sides}`" role="img" :aria-label="visualLabel">
    <img
      v-if="assetSource"
      class="rolling-die-image"
      :key="props.sides"
      :src="assetSource"
      alt=""
      @error="useFallback"
    >
    <div v-else class="rolling-die-fallback" aria-hidden="true">
      <span class="rolling-die-fallback-facet rolling-die-fallback-facet-left"></span>
      <span class="rolling-die-fallback-facet rolling-die-fallback-facet-right"></span>
    </div>
    <strong v-if="props.result !== null && !props.rolling" class="rolling-die-face-value">{{ faceLabel }}</strong>
    <small class="rolling-die-type">{{ diceLabel(props.sides) }}</small>
  </div>
</template>
