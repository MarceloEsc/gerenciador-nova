<template>
      <Toast position="bottom-right" />

      <Toolbar>
            <template #start>
                  <Button label="Exportar como..." class="mr-2" severity="secondary" @click="toggle"
                        aria-haspopup="true" aria-controls="overlay_tmenu" />

                  <TieredMenu ref="menu" id="overlay_tmenu" :model="items" popup>
                        <template #item="{ item }">
                              <!-- TO-DO EXPORTAR COMBUSTIVEL PARA EXCEL -->
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
                  <!-- ---------------------------------------------------------------------------------------------->
                  <Button icon="pi pi-upload" label="tudo" @click="importAll('arquivoExcel')" severity="contrast" rounded="true" outlined="true"
                  style="border: 0; " />
                  <Button icon="pi pi-refresh" @click="confirmImport(selectedPage, 'arquivoExcel')" severity="contrast" rounded="true" outlined="true"
                  style="border: 0; " />

                  <Dropdown v-model="selectedPage" :options="excelPages" placeholder="Escolha a página" optionLabel="label" optionValue="label"
                          style="min-width: 7.2rem" class="excel-drop" @change="confirmImport(selectedPage, 'arquivoExcel')"/>
                  <input type="file" id="arquivoExcel" accept=".xlsx" @change="textPathAndImportExcel('arquivoExcel')" class="pdf-input">
            </template>
            <template #end>
                  <Button label="Importar PDF" severity="primary" @click="combModalVisible = true"
                        v-if="props.type === 'combustivel'" />
                  <!-- <Button label="Adicionar item/s" severity="primary" @click="manutModalVisible = true"
                        v-if="props.type === 'manutencao'" disabled /> -->
            </template>
      </Toolbar>

      <Dialog v-model:visible="combModalVisible" modal header="Escolha o PDF"
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
                  <Button type="button" label="Cancelar" severity="secondary" @click="combModalVisible = false" />
                  <Button type="button" label="Salvar" severity="primary"
                        @click="saveData('combustivel'), clearForm('combustivel')" />
            </div>
      </Dialog>

      <!-- <Dialog v-model:visible="manutModalVisible" modal header="Preencha os dados"
            :style="{ width: '50vw', height: '90rem' }" v-if="props.type === 'manutencao'"
            @after-hide="manNewItem.value = {}; console.log(manNewItem.value)" @show="openNewManutItem">

            <div>
                  <label for="date">Data </label>
                  <Calendar v-model="manNewItem.date" dateFormat="dd/mm/yyyy"
                        @date-select="manNewItem.date = convert.convertDateToFormatString($event)" />
                  <Divider />
                  <label for="vtr"> VTR </label>
                  <Dropdown v-model="manNewItem.vtr" :options="vtr_list" optionLabel="label" optionValue="label"
                        :placeholder="manNewItem.vtr" class="p-column-filter" style="min-width: 7.2rem" />
                  <Divider />
                  <div>
                        <Button type="button" label="Novo item" icon="pi pi-plus" severity="primary"
                              @click="newEditItem($event, manNewItem.items)" />
                  </div>
                  <div v-for="item in manNewItem.items" class="items-box">
                        <label for="item">Item </label>
                        <InputText v-model="item.item" style="width: 5rem" class="input-number-editor" />
                        <label for="price">Preço </label>
                        <InputNumber v-model="item.price" locale="pt-BR" :minFractionDigits="2" style="width: 5rem"
                              class="input-number-editor" @update:modelValue="getEditTotal($event, manNewItem.items)" />
                        <Button type="button" icon="pi pi-minus" severity="danger"
                              @click="removeEditItem($event, item, manNewItem.items)" />
                  </div>
                  <Divider />

                  <label for="edit-total-cost">Total </label>
                  <InputNumber v-model="manNewItem.totalCost" locale="pt-BR" :minFractionDigits="2" style="width: 5rem"
                        class="input-number-editor" />
            </div>

            <div class="flex justify-content-end gap-2">
                  <Button type="button" label="Cancelar" severity="secondary" @click="manutModalVisible = false" />
                  <Button type="button" label="Salvar" severity="primary" @click="saveData('manutencao')" />
            </div>

      </Dialog> -->
</template>

<script setup>
import { ref } from 'vue';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import Toolbar from 'primevue/toolbar';
import Dialog from 'primevue/dialog';
import Button from "primevue/button";

import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Calendar from 'primevue/calendar';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Dropdown from 'primevue/dropdown';
import Divider from 'primevue/divider';
import TieredMenu from 'primevue/tieredmenu';

import { v4 as uuidv4 } from 'uuid';
import { convert } from '../scripts/convert';

const props = defineProps(['type', 'combHasVTRFilter', 'combHasDateFilter','manHasVTRFilter', 'manHasDateFilter',  'combDataTable', 'manDataTable'])
const emit = defineEmits(['importResExcel', 'manutencaoExportState'])

const ipcRenderer = window.electron.ipcRenderer

const toast = useToast();

const combModalVisible = ref(false)
const combModalItems = ref([])
const combEditingRows = ref([])

const manutModalVisible = ref(false)
const manutModalItems = ref([])
const manutEditingRows = ref([])

const textPathAndSendConvert = (path) => {
      let fullpath = document.getElementById(path).files[0].path;
      console.log(fullpath)
      ipcRenderer.send('sendData:converter-pdf', fullpath)
}
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

const manutencaoExportState = ref([])
const textPathAndImportExcel = (path) => {
      let fullpath = document.getElementById(path).files[0].path;
      console.log(fullpath)
      ipcRenderer.send('import:Excel', fullpath, 'load')
}
const confirmImport = (selectedWorksheet, path) => {
      if (selectedWorksheet == 'Vazio') return
      console.log(selectedWorksheet);
      let fullpath = document.getElementById(path).files[0].path;
      emit('manutencaoExportState', selectedWorksheet)
      ipcRenderer.send('import:Excel', fullpath, 'import', selectedWorksheet)
}
const importAll = (path) => {
      selectedPage.value = 'Vazio'
      emit('manutencaoExportState', null)
      let fullpath = document.getElementById(path).files[0].path;
      ipcRenderer.send('import:Excel', fullpath, 'all')
}
ipcRenderer.on('importRes:Excel', (res, data, type) => {
      if (type == 'load') {
            excelPages.value = data
            return
      }
      console.log(data);
      manutencaoExportState.value = data
      emit('importResExcel', data)
})

const onRowEditSave = (event, typeC) => {
      let { newData, index } = event;
      if (typeC) {
            combModalItems.value[index] = newData;
            console.log(combModalItems.value[index]);
            return
      }
      manutModalItems.value[index] = newData;
      console.log(manutModalItems.value[index]);
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
      if (type == 'combustivel') {
            combModalItems.value = combModalItems.value.filter(val => val._id !== id);
            combEditingRows.value = combEditingRows.value.filter(val => val._id !== id)
            return
      }
      else if (type == 'manutencao') {
            manutModalItems.value = manutModalItems.value.filter(val => val._id !== id);
            manutEditingRows.value = manutEditingRows.value.filter(val => val._id !== id)
      }
}

const addNewItem = (type) => {
      if (type == 'combustivel') {
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
      console.log(obj);
}

const manNewItem = ref({})
const openNewManutItem = () => {
      manNewItem.value = {
            _id: uuidv4(),
            date: convert.convertDateToFormatString(new Date()),
            vtr: '',
            items: [
                  {
                        item: '',
                        price: 0,
                  },
            ],
            totalCost: 0,
            tag: 'manutencao',
      }
      console.log(manNewItem.value);
}

const newEditItem = (evet, items) => {
      items.push({
            item: '',
            price: 0
      })
}

const removeEditItem = (event, item, items) => {
      let index = items.findIndex((obj) => {
            return obj == item
      })
      items.splice(index, 1)
      getEditTotal(event, items)
}

const getEditTotal = (event, items) => {
      manNewItem.value.totalCost = 0
      items.forEach(item => {
            manNewItem.value.totalCost += item.price
      })
}

const clearForm = (typeC) => {
      if (typeC) {
            combModalItems.value = []
            combEditingRows.value = []
            return
      }
      manutModalItems.value = []
      manutEditingRows.value = []
}

const vtr_list = ref([
      { label: 'VTR 25' },
      { label: 'VTR 26' },
      { label: 'VTR 27' },
      { label: 'VTR 28' },
      { label: 'VTR 29' },
      { label: 'VTR 30' },
      { label: 'VTR 31' },
      { label: 'VTR 32' },
      { label: 'VTR 33' },
      { label: 'VTR 34' },
      { label: 'VTR 35' },
      { label: 'VTR 36' },
      { label: 'VTR 37' },
      { label: 'VTR 38' },
      { label: 'VTR 39' },
      { label: 'VTR 40' },
      { label: 'VTR 41' }
])
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
                        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Escolha uma VTR para exportar!', life: 3000 })
                        return
                  }
                  ipcRenderer.send('export:PDF', type, JSON.stringify(props.manHasDateFilter), JSON.stringify(props.manHasVTRFilter), JSON.stringify(props.manDataTable.processedData))
            },
      },
      /* {
            label: 'Excel',
            icon: 'pi pi-file-excel',
            comand: (event, type) => {
                  console.log(type + ' excel')
                  if (type == 'combustivel') {
                        if (props.combDataTable.processedData.length == 0) {
                              toast.add({ severity: 'error', summary: 'Atenção', detail: 'Nenhum dado pronto para exportar!', life: 3000 })
                              return
                        }
                        if (props.combHasDateFilter.state == false) {
                              toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Escolha uma data ou VTR para exportar!', life: 3000 })
                              return
                        }
                        else if (props.combHasVTRFilter.state == true) {
                              toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Remova o filtro de VTR!', life: 3000 })
                              return
                        }
                        ipcRenderer.send('export:Excel', type, JSON.stringify(props.combHasDateFilter), JSON.stringify(props.combHasVTRFilter), JSON.stringify(props.combDataTable.processedData))
                        return
                  }

                  if (props.manDataTable.processedData.length == 0) {
                        toast.add({ severity: 'error', summary: 'Atenção', detail: 'Nenhum dado pronto para exportar!', life: 3000 })
                        return
                  }
                  if (props.manHasDateFilter.state == false) {
                        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Escolha uma data para exportar!', life: 3000 })
                        return
                  }
                  else if (props.manHasVTRFilter.state == true) {
                        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Remova o filtro de VTR!', life: 3000 })
                        return
                  }
                  ipcRenderer.send('export:Excel', type, JSON.stringify(props.manHasDateFilter), JSON.stringify(props.manHasVTRFilter), JSON.stringify(props.manDataTable.processedData))
            },
      } */
]

const selectedPage = ref()
const excelPages = ref([
      {label: 'Vazio'}
])
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