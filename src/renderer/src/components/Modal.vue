<template>
      <Dialog v-model:visible="combModalVisibleCopy" modal header="Escolha o PDF"
            :style="{ width: '95vw', height: '90rem', }" v-if="props.type === 'combustivel'" :position="'top'"
            @after-hide="clearForm('combustivel')" @show="console.log(props.type)" id="combDialog"
            :dismissableMask="true">

            <Toolbar>
                  <template #start>
                        <input type="file" id="arquivoPdf" accept=".pdf" @change="textPathAndSendConvert"
                              class="pdf-input">
                  </template>
                  <template #end>
                        <Button label="Novo Item" icon="pi pi-plus" severity="primary"
                              @click="addNewItem('combustivel')" />
                  </template>
            </Toolbar>

            <DataTable ref="combDataTable" :value="combModalItems" dataKey="id" v-model:editingRows="combEditingRows"
                  editMode="row" v-model:selection="combEditingRows" @row-edit-save="onRowEditSave($event)"
                  @row-edit-cancel="console.log('cancelado' + $event.newData._id)" scrollable scrollHeight="60vh">

                  <Column field="timestamp" header="Data" style="width: 20%">
                        <template #editor="{ data, field }">
                              <Calendar v-model="data[field]" dateFormat="dd/mm/yy" mask="99/99/9999"
                                    @date-select="  data[field] = convert.convertDateToFormatString($event)" />
                        </template>
                  </Column>

                  <Column field="vtr" header="VTR" style="width: 15%">
                        <template #editor="{ data, field }">
                              <Dropdown v-model="data[field]" filter :options="props.vtrList" optionLabel="vtr"
                                    optionValue="vtr" :placeholder="data[field]" />
                        </template>
                  </Column>

                  <Column field="lt" header="Lt" style="width: 15%">
                        <template #editor="{ data, field }">
                              <InputNumber v-model="data[field]" :minFractionDigits="3" :maxFractionDigits="3"
                                    style="width: 5rem" class="input-number-editor" placeholder="0" />
                        </template>
                  </Column>

                  <!-- <Column field="odometer" header="Odômetro" style="width: 15%">
                        <template #editor="{ data, field }">
                              <InputNumber v-model="data[field]" :useGrouping="false" style="width: 5rem"
                                    class="input-number-editor" placeholder="0" />
                        </template>
                  </Column> -->

                  <Column field="price" header="Valor" style="width: 15%">
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
                                    @click="console.log(data), removeRow(data.id)" />
                        </template>
                  </Column>
            </DataTable>

            <div class="flex justify-content-end gap-2">
                  <Button type="button" label="Cancelar" severity="secondary" @click="emit('closeModal', false)" />
                  <Button type="button" label="Salvar" severity="primary" @click="saveData(), clearForm()" />
            </div>
      </Dialog>
</template>

<script setup>
      import { ref } from 'vue';
      import Toolbar from 'primevue/toolbar';
      import Dialog from 'primevue/dialog';
      import Button from "primevue/button";

      import DataTable from 'primevue/datatable';
      import Column from 'primevue/column';
      import Calendar from 'primevue/calendar';
      import InputNumber from 'primevue/inputnumber';
      import Dropdown from 'primevue/dropdown';

      import { useConfirm } from "primevue/useconfirm";
      const confirm = useConfirm()

      import { convert } from '../scripts/convert';
      import { v4 as uuidv4 } from 'uuid';

      const props = defineProps(['type', 'combDataTable', 'manDataTable', 'vtrList'])
      const emit = defineEmits(['closeModal', 'requestCombustivelData'])
      const model = defineModel('modalVisible')

      const ipcRenderer = window.electron.ipcRenderer

      const combModalVisibleCopy = model
      const combModalItems = ref([])
      const combEditingRows = ref([])

      const textPathAndSendConvert = () => {
            let fullpath = document.getElementById('arquivoPdf').files[0].path;
            console.log(fullpath)
            combModalItems.value = []
            ipcRenderer.invoke('sendData:converter-pdf', fullpath).then(res => {
                  console.log(res);
                  res.forEach(item => {
                        item.timestamp = convert.convertDateToFormatString(item.timestamp)
                        combModalItems.value.push(item)
                  });
            })
      }

      const onRowEditSave = (event) => {
            let { newData, index } = event;
            combModalItems.value[index] = newData;
            console.log(combModalItems.value[index]);
      }

      const saveData = () => {
            let data = [...combModalItems.value]
            data.forEach(item => {
                  item.timestamp = convert.convertDateToMilliseconds(item.timestamp)
            })
            ipcRenderer.send('insertFaturas', JSON.stringify(data))
            emit('requestCombustivelData')
            clearForm()
      }

      const removeRow = (id) => {
            confirm.require({
                  message: 'Deseja apagar essa transação?',
                  header: 'Confirme',
                  position: 'right',
                  rejectProps: {
                        label: 'cancelar',
                        severity: 'secondary',
                        outlined: true
                  },
                  acceptProps: {
                        label: 'excluir',
                        severity: 'danger',
                  },
                  accept: () => {
                        combModalItems.value = combModalItems.value.filter(val => val.id !== id);
                        combEditingRows.value = combEditingRows.value.filter(val => val.id !== id)
                  }
            })
      }

      const addNewItem = () => {
            const obj = {
                  id: uuidv4(),
                  timestamp: convert.convertDateToFormatString(new Date()),
                  vtr: 'VTR 00',
                  lt: null,
                  odometer: null,
                  price: null,
            }
            combModalItems.value.push(obj)
            return
      }

      const clearForm = () => {
            combModalItems.value = []
            combEditingRows.value = []
            document.getElementById('arquivoPdf').value = null
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

      @media (prefers-color-scheme: dark) {
            #combDialog .p-inputtext:enabled:focus {
                  border-color: #fff;
            }

            #combDialog .p-dropdown:not(.p-disabled).p-focus {
                  border-color: #fff;
            }

            .p-dropdown-filter-container>.p-inputtext:enabled:focus {
                  border-color: #fff;
            }
      }

      @media (prefers-color-scheme: light) {
            #combDialog .p-inputtext:enabled:focus {
                  border-color: #000;
            }

            #combDialog .p-dropdown:not(.p-disabled).p-focus {
                  border-color: #000;
            }

      }
</style>