<script setup lang="ts">
import { toRefs } from 'vue'

import CreationEquipmentChoices from '../CreationEquipmentChoices.vue'
import type { CharacterCreationModel } from '../../composables/useCharacterCreation'

type Props = {
    model: Readonly<
        Pick<
            CharacterCreationModel,
            'selectedClass' | 'classEquipmentOptions' | 'classEquipmentId' | 'previewEquipment'
        >
    >
    disabled?: boolean
}
type Emits = {
    selectClassKit: [id: string]
}

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

const { selectedClass, classEquipmentOptions, classEquipmentId, previewEquipment } = toRefs(
    props.model,
)
</script>

<template>
    <div class="grid gap-4">
        <div>
            <div>
                <h3>Набор класса · {{ selectedClass.label }}</h3>
                <p>Выберите один вариант — его предметы попадут в инвентарь при создании.</p>
            </div>
            <CreationEquipmentChoices
                :options="classEquipmentOptions"
                :selected-id="classEquipmentId"
                :disabled="disabled"
                sigil="⚔"
                item-count-label="позиций снаряжения"
                @select="emit('selectClassKit', $event)"
            />
        </div>
        <div>
            <strong>Будет добавлено в инвентарь</strong
            ><span
                v-for="(item, index) in previewEquipment"
                :key="`${item.source}-${item.name}-${index}`"
                >{{ item.name }} × {{ item.quantity }} <small>{{ item.source }}</small></span
            >
        </div>
    </div>
</template>
