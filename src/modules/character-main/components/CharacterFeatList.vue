<script setup lang="ts">
import { useModalUtil } from '@/composables/useModal'
import ConfirmModal from '@/components/modals/ConfirmModal.vue'
import CharacterFeatEditorModal from './CharacterFeatEditorModal.vue'
import EmptyCollection from '@/modules/character-inventory/components/EmptyCollection.vue'
import EntryActions from '@/modules/character-inventory/components/EntryActions.vue'
import type { CharacterFeat } from '@/types/character'

type Emits = {
    update: [feats: CharacterFeat[]]
}

const props = defineProps<{ feats: CharacterFeat[]; disabled?: boolean }>()

const emit = defineEmits<Emits>()

type EditorModalProps = {
    disabled?: boolean
    onSave: (feat: CharacterFeat) => void
}

type ConfirmModalProps = {
    text: string
    onOk: () => void | Promise<void>
}

const editorModal = useModalUtil<CharacterFeat, EditorModalProps>()

const confirmModal = useModalUtil<undefined, ConfirmModalProps>()

function save(feat: CharacterFeat) {
    const exists = props.feats.some(item => item.id === feat.id)
    emit(
        'update',
        exists
            ? props.feats.map(item => (item.id === feat.id ? feat : item))
            : [...props.feats, feat],
    )
}
function openEditor(feat: CharacterFeat) {
    editorModal.item.value = { ...feat }
    editorModal.props.value = { disabled: props.disabled, onSave: save }
    editorModal.openOrClose()
}
function add() {
    openEditor({ id: `feat-${Date.now()}`, name: '', description: '' })
}
function remove(id: string, name: string) {
    confirmModal.props.value = {
        text: `удалить черту «${name || 'без названия'}»?`,
        onOk: () =>
            emit(
                'update',
                props.feats.filter(feat => feat.id !== id),
            ),
    }
    confirmModal.openOrClose()
}
</script>

<template>
    <section class="feats-section">
        <div class="c-section-heading">
            <div>
                <h2>Черты персонажа</h2>
                <p class="c-section-note">
                    Пользовательские записи без автоматического применения эффектов.
                </p>
            </div>
            <NButton type="default" :disabled="disabled" @click="add">Добавить</NButton>
        </div>
        <EmptyCollection v-if="feats.length === 0" text="Черты пока не добавлены." />
        <div v-for="feat in feats" :key="feat.id" class="c-entry-card feat-entry-card">
            <div class="feat-entry-content">
                <h3 :title="feat.name || 'Без названия'">
                    {{ feat.name || 'Без названия' }}
                </h3>
            </div>
            <EntryActions
                :disabled="disabled"
                @edit="openEditor(feat)"
                @remove="remove(feat.id, feat.name)"
            />
        </div>
        <CharacterFeatEditorModal
            v-if="
                editorModal.isShowModal.value && editorModal.item.value && editorModal.props.value
            "
            :feat="editorModal.item.value"
            v-bind="editorModal.props.value"
            @close="editorModal.openOrClose"
        />
        <ConfirmModal
            v-if="confirmModal.isShowModal.value && confirmModal.props.value"
            v-bind="confirmModal.props.value"
            @close="confirmModal.openOrClose"
        />
    </section>
</template>

<style scoped>
.feats-section {
    margin-top: 18px;
}
.feat-entry-card {
    display: flex;
    align-items: center;
    gap: 14px;
}
.feat-entry-content {
    min-width: 0;
    flex: 1;
}
.feat-entry-content h3 {
    margin: 0;
    font-size: 1rem;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>
