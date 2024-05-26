<template>
      <div class="view">
            <div class="navbar">
                  <Button type="button" id="menuBtn" @click="emit('closeMenu')" severity="primary" label="voltar"
                        icon="pi pi-angle-left" />
                  <p class="titulo">
                        Configurações
                  </p>
            </div>
            <div class="inside">
                  <p class="divider">
                        <Button type="button" @click="exportDB" label="Exportar" severity="primary" />
                        Faz um backup portatil dos seus dados
                  </p>
                  <p class="divider">
                        <Button type="button" @click="importDB" label="Importar" severity="primary" />
                        Importa backup feito pelo programa
                  </p>
                  <p class="divider">
                        <Button type="button" @click="checkSync" label="Sincronizar" severity="primary" />
                        Sincroniza seus dados manualmente na nuvem
                  </p>
                  <p>
                        <Button id="openManager" type="button" @click="openManager" icon="pi pi-angle-right"
                              label="Gerenciar VTRs" severity="primary" />
                  </p>
                  <div id="manager" class='is-hidden manager-panel'>
                        <Button type="button" @click="newRow" label="Criar novo" severity="primary"
                              style="margin-bottom: 20px" />
                        <Button type="button" @click="modalVisible = true" label="migrar" severity="success" />

                        <DataTable :value="vtrModel" editMode="row" v-model:editingRows="editingList"
                              @row-edit-save="saveVTR($event)" @update:rows="console.log('change')">

                              <Column field="vtr" header="VTR" style="width: 150px">
                                    <template #editor="{ data, field }">
                                          <InputText v-model="data[field]" style="width: 100px"
                                                @update:modelValue="data[field] = $event.toLocaleUpperCase()" />
                                    </template>
                              </Column>

                              <Column field="placa" header="Placa" style="width: 150px">
                                    <template #editor="{ data, field }">
                                          <InputText v-model="data[field]" style="width: 100px"
                                                @update:modelValue="data[field] = $event.toLocaleUpperCase()" />
                                    </template>
                              </Column>

                              <Column :rowEditor="true" bodyStyle="text-align:center" style="width: 100px" />

                              <Column bodyStyle="text-align:center" style="width: 100px">
                                    <template #body="{ data, field }">
                                          <Button type="button" icon="pi pi-times" severity="danger"
                                                @click="removeRow($event, data)" />
                                    </template>
                              </Column>
                        </DataTable>
                  </div>
            </div>

            <Dialog v-model:visible="modalVisible" modal :style="{ width: '400px' }" :dismissableMask="true">
                  <div style="display: flex; justify-content: space-evenly; align-items: center; flex-wrap: wrap;">
                        <p style="font-size: 1.2rem; margin-bottom: 10px">Migrar dados para nova VTR</p>
                        <Dropdown v-model="oldVTR" :options="vtrModel" placeholder="Antiga VTR" optionLabel="vtr"
                              style="min-width: 7.2rem" />
                        <p class="pi pi-angle-right" style="font-size: 1.3rem"></p>
                        <Dropdown v-model="newVTR" :options="vtrModel" placeholder="Nova VTR" optionLabel="vtr"
                              style="min-width: 7.2rem" />

                        <Button type="button" @click="migrarVtr($event, oldVTR, newVTR)" label="Confirmar"
                              severity="primary" style="margin-top: 15px" />
                  </div>
            </Dialog>
      </div>
</template>
<script setup>
      import { ref, onMounted, onUnmounted } from 'vue';

      import Dialog from 'primevue/dialog';
      import DataTable from 'primevue/datatable';
      import Column from 'primevue/column';
      import InputText from 'primevue/inputtext';
      import Button from "primevue/button";
      import Dropdown from 'primevue/dropdown';

      import { useToast } from 'primevue/usetoast';
      import { useConfirm } from "primevue/useconfirm";
      const toast = useToast();
      const confirm = useConfirm()
      console.log('version ' + window.electron.process.env.npm_package_version);

      const ipcRenderer = window.electron.ipcRenderer
      const vtrModel = defineModel('vtrList')
      const emit = defineEmits(['closeMenu', 'removeVTR', 'saveVTR', 'migrarVtr', 'populateVTR', 'requestCombustivelData'])
      const oldVTR = ref()
      const newVTR = ref()

      const exportDB = () => {
            ipcRenderer.send('export:DB')
      }
      const importDB = () => {
            ipcRenderer.send('import:DB')
      }

      onMounted(() => {
            ipcRenderer.on('DB:result', (path, type) => {
                  if (type == 'error') {
                        toast.add({ severity: 'error', detail: 'Houve um erro', life: 3000 })
                        return
                  }
                  else if (type == 'export') {
                        toast.add({ severity: 'success', detail: `DB exportado para:${path}`, life: 3000 })
                        return
                  }
                  ipcRenderer.send('requestData:Combustivel')
                  toast.add({ severity: 'success', detail: 'Importado com sucesso', life: 3000 })
            })
      })

      onUnmounted(() => {
            ipcRenderer.removeAllListeners('DB:result')
      })

      const editingList = ref([])
      const modalVisible = ref(false)

      const removeRow = (event, data) => {
            confirm.require({
                  message: 'Deseja apagar essa VTR?',
                  header: 'Confirme',
                  rejectProps: {
                        label: 'cancelar',
                        severity: 'secondary',
                        outlined: true
                  },
                  acceptProps: {
                        label: 'excluir',
                        severity: 'danger',
                  },
                  accept: () => emit('removeVTR', data)
            })

      }

      const saveVTR = (event) => {
            let newD = false
            if (event.data.vtr !== event.newData.vtr || event.data.placa !== event.newData.placa)
                  newD = true

            if (newD) emit('saveVTR', event.data, event.newData)
      }
      const newRow = () => {
            ipcRenderer.send('insertVTR', JSON.stringify({ vtr: "novo", placa: "novo", }))
            emit('populateVTR')
      }

      const migrarVtr = (event, oldData, newData) => {
            if (!oldData || !newData || oldData == newData) {
                  toast.add({ severity: 'error', detail: 'Escolha uma VTR válida para migrar!', life: 3000 })
                  return
            }
            emit('migrarVtr', oldData, newData)
            emit('requestCombustivelData')
            toast.add({ severity: 'success', detail: `Dados da ${oldData.vtr} foram inseridos na ${newData.vtr}`, life: 3000 })
            newVTR.value = null
            oldVTR.value = null
            modalVisible.value = false
      }

      const openManager = (event) => {
            const managerBtn = document.getElementById('openManager').firstElementChild.classList
            const manager = document.getElementById('manager').classList
            manager.toggle('is-hidden')
            managerBtn.toggle('pi-angle-right')
            managerBtn.toggle('pi-angle-down')
      }

      const checkSync = () => ipcRenderer.send('checkSync')
</script>
<style scoped>
      .view {
            position: absolute;
            height: 100%;
            max-height: 100%;
            width: 100%;
            z-index: 2;
            user-select: none;
            overflow: hidden
      }

      .navbar {
            position: fixed;
            width: 100%;
            height: 70px;
            padding: 15px 5rem;
            right: 0;
            z-index: 2;
      }

      .inside {
            max-height: 92%;
            overflow: auto;
            margin-top: 4.3rem;
            padding: 1.3rem 5rem;
      }

      .titulo {
            font-size: 1.5rem;
            margin-bottom: 3rem;
      }

      .divider {
            margin-bottom: 1rem;
            font-size: 1.1rem;
      }

      Button {
            margin-right: 15px;
      }

      .manager-panel {
            max-width: 600px;
            margin-left: 5px;
            padding: 10px;
      }

      @media (prefers-color-scheme: dark) {
            .view {
                  background: #1b1f29;
            }

            .navbar {
                  background: #14161a;
            }

            .manager-panel {
                  background: #14161a;
            }
      }

      @media (prefers-color-scheme: light) {
            .view {
                  background: #fff;
            }

            .navbar {
                  background: #bbb;
            }

            .manager-panel {
                  background: #bbb;
            }
      }

</style>