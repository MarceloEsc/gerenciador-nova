<template>
      <Toolbar>
            <template #start>
                  <Button label="Exportar como..." class="mr-2" severity="secondary" @click="toggle"
                        aria-haspopup="true" aria-controls="overlay_tmenu" />

                  <TieredMenu ref="menu" id="overlay_tmenu" :model="items" popup>
                        <template #item="{ item }">
                              <div v-if="item.label != 'Excel' && props.type == 'combustivel'" @click="if (props.type == 'combustivel') item.comand($event, 'combustivel');
                              else item.comand($event, 'manutencao')" class="tiered-menu-item">
                                    <span :class="item.icon" style="margin-right: 10px;"></span>
                                    <span style="font-weight: 500;">{{ item.label }}</span>
                              </div>

                              <div v-if="props.type == 'manutencao'" @click="if (props.type == 'combustivel') item.comand($event, 'combustivel');
                              else item.comand($event, 'manutencao')" class="tiered-menu-item">
                                    <span :class="item.icon" style="margin-right: 10px;"></span>
                                    <span style="font-weight: 500;">{{ item.label }}</span>
                              </div>
                        </template>
                  </TieredMenu>
            </template>
            <template #center v-if="props.type === 'manutencao'">
                  <Button icon="pi pi-times" @click="cancelImportWatch('arquivoExcel')" severity="contrast"
                        rounded="true" outlined="true" style="border: 0; margin-right: 10px"
                        v-if="excelLoaded == true" />
                  <ProgressSpinner v-if="load == true" style="width: 30px; height: 30px; margin-right: 20px;" />

                  <input type="file" id="arquivoExcel" accept=".xlsx" @change="textPathAndImportExcel('arquivoExcel')"
                        class="pdf-input">
            </template>
            <template #end>
                  <Button label="Importar PDF" severity="primary" @click="emit('openModal', true)"
                        v-if="props.type === 'combustivel'" />
            </template>
      </Toolbar>
</template>
<script setup>
      import { ref, onMounted } from 'vue';
      import { useToast } from 'primevue/usetoast';
      import Toolbar from 'primevue/toolbar';
      import TieredMenu from 'primevue/tieredmenu';
      import Button from "primevue/button";
      import ProgressSpinner from 'primevue/progressspinner';

      const props = defineProps(['type', 'combHasVTRFilter', 'combHasDateFilter', 'manHasVTRFilter', 'manHasDateFilter', 'combDataTable', 'manDataTable'])
      const emit = defineEmits(['importResExcel', 'openModal'])
      const ipcRenderer = window.electron.ipcRenderer
      const toast = useToast();

      onMounted(() => {
            if (props.type == 'manutencao') {
                  ipcRenderer.on('importRes:Excel', (res, data, manVtr, manPlaca) => {
                        console.log(data);
                        load.value = false
                        excelLoaded.value = true
                        emit('importResExcel', data, manVtr, manPlaca)
                  })
            }
      })

      const textPathAndImportExcel = (path) => {
            selectedPage.value = null
            let files = document.getElementById(path).files

            let fullpath = files[0].path;
            console.log(document.getElementById(path));

            if (files.length > 0) {
                  load.value = true
                  ipcRenderer.send('import:Excel', fullpath, 'all')
                  return
            }
            ipcRenderer.send('import:Excel', null)
      }


      const cancelImportWatch = (path) => {
            excelLoaded.value = false
            document.getElementById(path).value = null
            textPathAndImportExcel(path)
      }

      const menu = ref()
      const toggle = (event) => menu.value.toggle(event);
      const items = [
            {
                  label: 'PDF',
                  icon: 'pi pi-file-pdf',
                  comand: (event, type) => {
                        console.log(type + ' pdf')
                        if (type == 'combustivel') {
                              if (props.combDataTable.processedData.length == 0) {
                                    toast.add({ severity: 'error', summary: 'Atenção', detail: 'Nenhum dado pronto para exportar!', life: 3000 })
                                    return
                              }
                              else if (!props.combHasDateFilter.state && !props.combHasVTRFilter.state) {
                                    toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Escolha uma data ou VTR para exportar!', life: 3000 })
                                    return
                              }
                              ipcRenderer.send('export:PDF', type, JSON.stringify(props.combHasDateFilter), JSON.stringify(props.combHasVTRFilter), JSON.stringify(props.combDataTable.processedData))
                              return
                        }

                        if (props.manDataTable.processedData.length == 0) {
                              toast.add({ severity: 'error', summary: 'Atenção', detail: 'Nenhum dado pronto para exportar!', life: 3000 })
                              return
                        }
                        else if (!props.manHasDateFilter && !props.manHasVTRFilter.state) {
                              toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Escolha uma VTR e Placa para exportar!', life: 3000 })
                              return
                        }
                        ipcRenderer.send('export:PDF', type, JSON.stringify(props.manHasDateFilter), JSON.stringify(props.manHasVTRFilter), JSON.stringify(props.manDataTable.processedData))
                  },
            },
      ]

      const selectedPage = ref()
      const excelLoaded = ref(false)
      const load = ref(false)
</script>
<style scoped>
      .tiered-menu-item {
            display: list-item;
            width: 100%;
            cursor: pointer;
            padding: 0.5rem 0.75rem;
            display: flex;
            align-items: center;
            user-select: none;
      }

      .p-toolbar {
            border: 0;
            position: sticky;
            top: 0px;
            z-index: 1;
            border-bottom: 1px solid var(--p-toolbar-border-color);
            border-radius: 0;
      }

      .p-inputtext {
            max-width: 130px;
      }

      .pdf-input {
            width: 500px;
      }

      .pdf-input::file-selector-button {
            width: 136px;
      }

      .pdf-input::file-selector-button {
            border-radius: 4px;
            padding: 0 16px;
            height: 40px;
            cursor: pointer;
            margin-right: 16px;
            transition: background-color 200ms;
      }

      .excel-drop {
            margin-right: 20px;
      }

      @media (prefers-color-scheme: dark) {
            .pdf-input::file-selector-button {
                  background-color: #182447;
                  border: 1px solid #182447;
            }

            .pdf-input::file-selector-button:hover {
                  background-color: #1b2e66;
            }
      }

      @media (prefers-color-scheme: light) {
            .pdf-input::file-selector-button {
                  background-color: #dddddd;
                  border: 1px solid #dddddd;
            }

            .pdf-input::file-selector-button:hover {
                  background-color: #cccccc;
            }
      }

      .flex {
            display: flex;
      }

      .justify-content-end {
            justify-content: flex-end;
      }

      .gap-2 {
            padding-top: 20px;
            gap: 2rem;
      }
</style>

<style>
      .p-dialog>.p-dialog-content {
            overflow-y: hidden;
      }
</style>