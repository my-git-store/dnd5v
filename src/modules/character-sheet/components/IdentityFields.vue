<script setup lang="ts">
import { computed } from "vue";

import type { CharacterGender } from "../types/character";
import type { CharacterIdentityPatch, CharacterSheetView } from "../types/characterView";

const props = defineProps<{ character: CharacterSheetView; disabled?: boolean; gender?: CharacterGender }>();
const emit = defineEmits<{ update: [patch: CharacterIdentityPatch] }>();
const selectedGender = computed(() => props.gender ?? props.character.creation?.gender ?? "female");
const genderLocked = computed(() => Boolean(props.character.creation));

function update(key: keyof CharacterIdentityPatch, value: unknown) {
  if (key === "gender") {
    emit("update", { gender: value === "male" ? "male" : "female" });
    return;
  }
  if (key === "level" || key === "experience") {
    const parsed = Number(value);
    emit("update", { [key]: Number.isFinite(parsed) ? Math.trunc(parsed) : 0 });
    return;
  }
  emit("update", { [key]: String(value ?? "") } as CharacterIdentityPatch);
}
</script>

<template>
  <div class="identity-fields">
    <p class="section-note identity-fields-note">Имя, происхождение, пол и текущий уровень героя.</p>
    <div class="identity-grid">
      <NFormItem label="Имя"
        ><NInput :disabled="disabled" :value="character.name" @update:value="update('name', $event)"
      /></NFormItem>
      <NFormItem :label="character.ruleset === '2024' ? 'Вид' : 'Раса'"
        ><NInput :disabled="disabled" :value="character.race.name" @update:value="update('raceName', $event)"
      /></NFormItem>
      <NFormItem label="Класс"
        ><NInput :disabled="disabled" :value="character.class" @update:value="update('className', $event)"
      /></NFormItem>
      <NFormItem label="Подкласс"
        ><NInput :disabled="disabled" :value="character.subclass" @update:value="update('subclass', $event)"
      /></NFormItem>
      <NFormItem label="Предыстория"
        ><NInput
          :disabled="disabled"
          :value="character.background.name"
          @update:value="update('backgroundName', $event)"
      /></NFormItem>
      <NFormItem label="Мировоззрение"
        ><NInput :disabled="disabled" :value="character.alignment" @update:value="update('alignment', $event)"
      /></NFormItem>
      <NFormItem label="Уровень"
        ><NInputNumber
          min="1"
          max="20"
          step="1"
          :disabled="disabled"
          :value="character.level"
          @update:value="update('level', $event)"
      /></NFormItem>
      <NFormItem label="Опыт"
        ><NInputNumber
          min="0"
          step="1"
          :disabled="disabled"
          :value="character.experience"
          @update:value="update('experience', $event)"
      /></NFormItem>
      <fieldset class="gender-choice identity-gender">
        <legend>Пол персонажа</legend>
        <div class="gender-choice-options" role="radiogroup" aria-label="Пол персонажа">
          <button
            type="button"
            class="gender-choice-button"
            :class="{ selected: selectedGender === 'female' }"
            :aria-pressed="selectedGender === 'female'"
            :disabled="disabled || genderLocked"
            :title="genderLocked ? 'Пол фиксируется после создания персонажа.' : undefined"
            @click="update('gender', 'female')"
          >
            Женский
          </button>
          <button
            type="button"
            class="gender-choice-button"
            :class="{ selected: selectedGender === 'male' }"
            :aria-pressed="selectedGender === 'male'"
            :disabled="disabled || genderLocked"
            :title="genderLocked ? 'Пол фиксируется после создания персонажа.' : undefined"
            @click="update('gender', 'male')"
          >
            Мужской
          </button>
        </div>
      </fieldset>
    </div>
  </div>
</template>
