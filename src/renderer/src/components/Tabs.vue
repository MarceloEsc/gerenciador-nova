<template>
  <div class="card">
    <TabMenu :model="items" :activeIndex="index" />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import TabMenu from 'primevue/tabmenu';

const index = ref()
onMounted(() => {
  index.value = 0
})

const emit = defineEmits(['tab'])

const items = ref([
  {
    label: 'Combustível',
    icon: 'pi pi-home',
    command: () => emit('tab', 'comb')
  },
  {
    label: 'Manutenção',
    icon: 'pi pi-chart-line',
    command: () => emit('tab', 'manut')
  },
]);
</script>

<style>
.p-tabmenuitem.p-highlight .p-menuitem-link {
  color: black
}

.p-tabmenu-ink-bar {
  width: 135px;
  background-color: black
}
</style>