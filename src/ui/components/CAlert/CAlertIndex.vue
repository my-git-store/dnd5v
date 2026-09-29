<script setup lang="ts">
import { useAlert, type AlertObj } from './useAlert';
import CAlert from './CAlert.vue';
import { computed } from 'vue';

const { alerts, closeAlert } = useAlert()

const alertList = computed<AlertObj[]>(() => alerts.value)
</script>

<template>
    <div v-if="alertList.length !== 0" class="fixed z-10000 bottom-0 right-0 p-2 c-flex-col overflow-hidden">
        <CAlert v-for="alert in alertList" :key="`alert-${alert.id}`" @click.stop :title="alert.title"
            :type="alert.type" :v-bind="alert" @close="closeAlert(alert.id)">
            {{ alert.id }}
        </CAlert>
    </div>
</template>