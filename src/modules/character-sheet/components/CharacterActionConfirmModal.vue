<script setup lang="ts">
import { CBtn, CModal } from '@/ui/components'
import { useDialog } from '@/ui/components'

const props = withDefaults(defineProps<{
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  onConfirm?: () => void | Promise<void>
}>(), { confirmLabel: 'Подтвердить', danger: false })

const emit = defineEmits<{ close: [] }>()
const { close } = useDialog()

async function confirm() {
  await props.onConfirm?.()
  close()
}
</script>

<template>
  <CModal @close="emit('close')">
    <section class="character-action-confirm sheet-section" role="dialog" aria-modal="true" :aria-label="title">
      <h2>{{ title }}</h2>
      <p>{{ message }}</p>
      <div class="editor-actions">
        <CBtn color-type="accent" @click="close">Отмена</CBtn>
        <CBtn :color-type="danger ? 'delete' : 'primary'" @click="confirm">{{ confirmLabel }}</CBtn>
      </div>
    </section>
  </CModal>
</template>
