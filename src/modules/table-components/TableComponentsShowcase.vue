<script setup lang="ts">
import DiceRoller from './components/dice/DiceRoller.vue'
import InitiativeTracker from './components/initiative/InitiativeTracker.vue'
import './styles/table-components.css'
</script>

<template>
  <section class="table-components-showcase" aria-labelledby="table-components-title">
    <div class="app-shell">
      <header class="app-header">
        <p class="eyebrow">Демо · локальные инструменты</p>
        <h2 id="table-components-title">Игровые компоненты</h2>
        <p class="showcase-note">Самостоятельные компоненты «Бросок кубиков» и «Трекер инициативы» для будущего игрового стола. Состояние прототипа хранится локально в компоненте.</p>
      </header>
      <div class="component-grid" aria-label="Компоненты игрового стола">
        <DiceRoller />
        <InitiativeTracker />
      </div>
    </div>
  </section>
</template>
