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
    <div class="creation-step-content">
        <div class="equipment-choice-group">
            <div class="equipment-group-heading">
                <h3>Набор класса · {{ selectedClass.label }}</h3>
                <p class="c-section-note">
                    Выберите один вариант — его предметы попадут в инвентарь при создании.
                </p>
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
        <div class="equipment-preview-strip">
            <strong>Будет добавлено в инвентарь</strong
            ><span
                v-for="(item, index) in previewEquipment"
                :key="`${item.source}-${item.name}-${index}`"
                >{{ item.name }} × {{ item.quantity }} <small>{{ item.source }}</small></span
            >
        </div>
    </div>
</template>

<style scoped src="../styles/creation-sections.css"></style>
<style scoped>
.equipment-preview-strip {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 7px;
    margin-top: 18px;
    padding: 12px;
    border: 1px dashed #c7ac7d;
    border-radius: 10px;
    background: rgba(251, 241, 218, 0.62);
}
.equipment-preview-strip > strong {
    width: 100%;
    color: #72512c;
    font-size: 0.76rem;
}
.equipment-preview-strip > span {
    padding: 5px 8px;
    border: 1px solid #e3d0ab;
    border-radius: 7px;
    background: #fff9eb;
    color: #57432c;
    font-size: 0.72rem;
}
.equipment-preview-strip small {
    margin-left: 4px;
    color: #977a50;
}
</style>
