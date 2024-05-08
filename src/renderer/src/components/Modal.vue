<template>
      <Dialog v-model:visible="combModalVisibleCopy" modal header="Escolha o PDF"
            :style="{ width: '95vw', height: '90rem', }" v-if="props.type === 'combustivel'" :position="'top'"
            @after-hide="clearForm('combustivel')" @show="console.log(props.type)">

            <Toolbar>
                  <template #start>
                        <input type="file" id="arquivoPdf" accept=".pdf" @change="textPathAndSendConvert('arquivoPdf')"
                              class="pdf-input">
                  </template>
                  <template #end>
                        <Button label="Novo Item" icon="pi pi-plus" severity="primary"
                              @click="addNewItem('combustivel')" />
                  </template>
            </Toolbar>

            <DataTable ref="combDataTable" :value="combModalItems" dataKey="_id" v-model:editingRows="combEditingRows"
                  editMode="row" v-model:selection="combEditingRows"
                  @row-edit-save="onRowEditSave($event, 'combustivel')"
                  @row-edit-cancel="console.log('cancelado' + $event.newData._id)" scrollable scrollHeight="60vh">

                  <Column field="date" header="Data" style="width: 20%">
                        <template #editor="{ data, field }">
                              <Calendar v-model="data[field]" dateFormat="dd/mm/yy" mask="99/99/9999"
                                    @date-select="  data[field] = convert.convertDateToFormatString($event)" />
                        </template>
                  </Column>

                  <Column field="vtr" header="VTR" style="width: 15%">
                        <template #editor="{ data, field }">
                              <Dropdown v-model="data[field]" filter :options="vtr_list" optionLabel="label"
                                    optionValue="label" :placeholder="data[field]" />
                        </template>
                  </Column>

                  <Column field="lt" header="Lt" style="width: 15%">
                        <template #editor="{ data, field }">
                              <InputNumber v-model="data[field]" style="width: 5rem" class="input-number-editor" />
                        </template>
                  </Column>

                  <Column field="odometer" header="Odômetro" style="width: 15%">
                        <template #editor="{ data, field }">
                              <InputNumber v-model="data[field]" style="width: 5rem" class="input-number-editor" />
                        </template>
                  </Column>

                  <Column field="cost" header="Valor" style="width: 15%">
                        <template #body="{ data, field }">
                              {{ convert.formatCurrency(data[field]) }}
                        </template>
                        <template #editor="{ data, field }">
                              <InputNumber v-model="data[field]" mode="currency" currency="BRL" />
                        </template>
                  </Column>

                  <Column :rowEditor="true" style="width: 10%; min-width: 8rem" bodyStyle="text-align:center"></Column>

                  <Column style="width: 10%; min-width: 8rem" bodyStyle="text-align:center">
                        <template #body="{ data }">
                              <Button type="button" label="Excluir" icon="pi pi-delete-left" severity="danger"
                                    @click="console.log(data), removeRow(data._id, 'combustivel')" />
                        </template>
                  </Column>
            </DataTable>

            <div class="flex justify-content-end gap-2">
                  <Button type="button" label="Cancelar" severity="secondary" @click="emit('closeModal', false)" />
                  <Button type="button" label="Salvar" severity="primary"
                        @click="saveData('combustivel'), clearForm('combustivel')" />
            </div>
      </Dialog>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import Toolbar from 'primevue/toolbar';
import Dialog from 'primevue/dialog';
import Button from "primevue/button";

import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Calendar from 'primevue/calendar';
import InputNumber from 'primevue/inputnumber';
import Dropdown from 'primevue/dropdown';

import { v4 as uuidv4 } from 'uuid';
import { convert } from '../scripts/convert';

const props = defineProps(['type', 'combDataTable', 'manDataTable', 'vtr_list'])
const emit = defineEmits(['closeModal'])
const model = defineModel()

const ipcRenderer = window.electron.ipcRenderer

const combModalVisibleCopy = model
const combModalItems = ref([])
const combEditingRows = ref([])

const textPathAndSendConvert = (path) => {
      let fullpath = document.getElementById(path).files[0].path;
      console.log(fullpath)
      ipcRenderer.send('sendData:converter-pdf', fullpath)
}

onMounted(() => {
      ipcRenderer.on('retrieveData:converter-pdf', (res, dataRes) => {
            //console.log(dataRes);
            dataRes.forEach(data => {
                  combModalItems.value.push(data.doc)
            });
            convert.sortDate(combModalItems.value)
            combModalItems.value.forEach(doc => {
                  doc.tag = 'combustivel'
                  doc.date = convert.convertDateToFormatString(doc.date)
            })
            //console.log(combModalItems.value)
      })
})

onUnmounted(() => {
      ipcRenderer.removeAllListeners('retrieveData:converter-pdf')
})

const onRowEditSave = (event, typeC) => {
      let { newData, index } = event;
      combModalItems.value[index] = newData;
      console.log(combModalItems.value[index]);
}

const saveData = (type) => {
      let data;
      if (type == 'combustivel') {
            data = JSON.stringify(combModalItems.value)
            ipcRenderer.send('requestSave', data, 'save')
            ipcRenderer.send('requestData:Combustivel')
      }
      else if (type == 'manutencao') {
            data = []
            data[0] = ({ ...manNewItem.value })
            console.log(data);
            ipcRenderer.send('requestSave', JSON.stringify(data), 'save')
            ipcRenderer.send('requestData:Manutencao')
      }
      //console.log(combModalItems.value);
      combModalItems.value = []
      combEditingRows.value = []

      openNewManutItem()
}

const removeRow = (id, type) => {
      combModalItems.value = combModalItems.value.filter(val => val._id !== id);
      combEditingRows.value = combEditingRows.value.filter(val => val._id !== id)
}

const addNewItem = (type) => {
      const obj = {
            _id: uuidv4(),
            date: convert.convertDateToFormatString(new Date()),
            vtr: '',
            driver: '',
            lt: 0,
            odometer: 0,
            cost: 0,
      }
      combModalItems.value.push(obj)
      return
}


const clearForm = (typeC) => {
      combModalItems.value = []
      combEditingRows.value = []
}
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
      border: 0
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

.excel-drop{
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