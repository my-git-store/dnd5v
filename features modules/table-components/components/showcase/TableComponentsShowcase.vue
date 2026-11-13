<script setup lang="ts">
import DiceRoller from '../dice/DiceRoller.vue'
import InitiativeTracker from '../initiative/InitiativeTracker.vue'
</script>

<template>
    <section aria-labelledby="table-components-title">
        <div>
            <header>
                <p>Демо · локальные инструменты</p>
                <h2 id="table-components-title">Игровые компоненты</h2>
                <p>
                    Самостоятельные компоненты «Бросок кубиков» и «Трекер инициативы» для будущего
                    игрового стола. Состояние прототипа хранится локально в компоненте.
                </p>
            </header>
            <div
                class="grid grid-cols-1 items-end gap-3 sm:grid-cols-2"
                aria-label="Компоненты игрового стола"
            >
                <DiceRoller />
                <InitiativeTracker />
            </div>
        </div>
    </section>
</template>
