<template>
  <Tabs @tab="changeTab" />

  <Button icon="pi" id="themeBtn" @click="toggleColorScheme" severity="contrast" rounded="true" outlined="true" />

  <div id="pageOne" class="">
    <CustomModal type="combustivel" />
    <Button label="Log displayed items" icon="pi pi-exclamation-circle" severity="danger" style="width: 15rem"
      @click="logCurrentTableItems" />

    <!-- PAGINATOR BUG paginator :rows="20" :rowsPerPageOptions="[20, 30, 40, 50]" -->
    <DataTable ref="combDataTable" :value="combItems" dataKey="_id" v-model:editingRows="combEditingRows" editMode="row"
      v-model:selection="combEditingRows" @row-edit-save="onRowEditSave($event, 'combustivel')"
      @row-edit-cancel="console.log($event)" v-model:filters="filters" filterDisplay="row">

      <Column field="date" header="Data" style="width: 20%">
        <template #editor="{ data, field }">
          <Calendar v-model="data[field]" dateFormat="dd/mm/yy" mask="99/99/9999"
            @date-select="data[field] = convert.convertDateToFormatString($event)" />
        </template>
        <template #filter="{ filterModel, filterCallback }">
          <Calendar v-model="filterModel.value" view="month" dateFormat="mm/yy"
            @date-select="filterModel.value = convert.convertDateToFormatString($event).slice(3), filterCallback()"
            style="min-width: 13rem" />
        </template>
      </Column>

      <Column field="vtr" header="VTR" style="width: 15%">
        <template #editor="{ data, field }">
          <Dropdown v-model="data[field]" :options="vtr_list" optionLabel="label" optionValue="label"
            :placeholder="data[field]" />
        </template>
        <template #filter="{ filterModel, filterCallback }">
          <Dropdown v-model="filterModel.value" @change="filterCallback()" :options="vtr_list" optionLabel="label"
            optionValue="label" placeholder="VTR" class="p-column-filter" style="min-width: 7.2rem" />
        </template>
      </Column>

      <Column field="lt" header="Lt" style="width: 15%">
        <template #editor="{ data, field }">
          <InputNumber v-model="data[field]" locale="pt-BR" style="width: 5rem" class="input-number-editor" />
        </template>
      </Column>

      <Column field="odometer" header="Odômetro" style="width: 15%">
        <template #editor="{ data, field }">
          <InputNumber v-model="data[field]" locale="pt-BR" style="width: 5rem" class="input-number-editor" />
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

      <Column :rowEditor="true" style="width: 10%; min-width: 8rem" bodyStyle="text-align:center">
      </Column>

      <Column style="width: 10%; min-width: 8rem" bodyStyle="text-align:center">
        <template #body="{ data }">
          <Button type="button" label="Excluir" icon="pi pi-delete-left" severity="danger"
            @click="removeRow($event, data, 'combustivel')" />
        </template>
      </Column>

    </DataTable>
  </div>

  <div id="pageTwo" class="is-hidden">
    <CustomModal type="manutencao" />

    <DataTable ref="manDataTable" :value="manItems" dataKey="_id">
      <Column field="date" header="Data" style="width: 20%">
      </Column>

      <Column field="vtr" header="VTR" style="width: 20%">
      </Column>

      <Column field="items" header="Itens" style="width: 20%">
        <template #body="{ data, field }">
          <div v-for="item in data[field]">
            {{ item.item }} {{ convert.formatCurrency(item.price) }}
          </div>
        </template>
      </Column>

      <Column field="totalCost" header="Valor" style="width: 20%">
        <template #body="{ data, field }">
          {{ convert.formatCurrency(data[field]) }}
        </template>
      </Column>

      <Column style="width: 10%; min-width: 8rem" bodyStyle="text-align:center">
        <template #body="{ data }">
          <Button type="button" label="" icon="pi pi-pencil" severity="info" @click="openEditManutItem($event, data)" />
        </template>
      </Column>
      <Column style="width: 10%; min-width: 8rem" bodyStyle="text-align:center">
        <template #body="{ data }">
          <Button type="button" label="Excluir" icon="pi pi-delete-left" severity="danger"
            @click="removeRow($event, data, 'manutencao')" />
        </template>
      </Column>
    </DataTable>

    <!-- TO-DO STYLE THIS MODAL ALREADY IDIOT -->
    <Dialog v-model:visible="manModal" modal header="Editando" :style="{ width: '50vw', height: '90rem', }">
      <div>
        <label for="date">Data </label>
        <Calendar v-model="manEditItem.date" dateFormat="dd/mm/yyyy"
          @date-select="manEditItem.date = convert.convertDateToFormatString($event)" />
        <Divider />
        <label for="vtr"> VTR </label>
        <Dropdown v-model="manEditItem.vtr" :options="vtr_list" optionLabel="label" optionValue="label"
          :placeholder="manEditItem.vtr" class="p-column-filter" style="min-width: 7.2rem" />
        <Divider />
        <div>
          <Button type="button" label="Novo item" icon="pi pi-plus" severity="primary"
            @click="newEditItem($event, manEditItem.items)" />
        </div>
        <div v-for="item in manEditItem.items" class="items-box">
          <label for="item">Item </label>
          <InputText v-model="item.item" style="width: 5rem" class="input-number-editor" />
          <label for="price">Preço </label>
          <InputNumber v-model="item.price" locale="pt-BR" :minFractionDigits="2" style="width: 5rem"
            class="input-number-editor" @update:modelValue="getEditTotal($event, manEditItem.items)" />
          <Button type="button" icon="pi pi-minus" severity="danger"
            @click="removeEditItem($event, item, manEditItem.items)" />
        </div>
        <Divider />

        <label for="edit-total-cost">Total </label>
        <InputNumber v-model="manEditItem.totalCost" locale="pt-BR" :minFractionDigits="2" style="width: 5rem"
          class="input-number-editor" />
      </div>
      <div class="flex justify-content-end gap-2">
        <Button type="button" label="Cancelar" severity="secondary" @click="manModal = !manModal" />
        <Button type="button" label="Salvar" severity="primary"
          @click="onRowEditSave($event, 'manutencao', manEditItem), clearForm()" />
      </div>
    </Dialog>
  </div>

</template>

<script setup>
import { ref, onMounted } from 'vue';

//PRIMEVUE COMPONENTS
import { FilterMatchMode } from 'primevue/api';

import Button from "primevue/button";
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Calendar from 'primevue/calendar';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Dropdown from 'primevue/dropdown';
import Dialog from 'primevue/dialog';
import Divider from 'primevue/divider';


//CUSTOM COMPONENTS
import Tabs from './components/Tabs.vue';
import CustomModal from './components/Modal.vue';
/* import  from './components/' */

//SCRIPTS
import { v4 as uuidv4 } from 'uuid';
import { convert } from './scripts/convert';

const ipcRenderer = window.electron.ipcRenderer

const combItems = ref([
  {
    _id: 69,
    date: '19/04/2024',
    vtr: 'VTR 24',
    driver: 'easter egg do marcelinho',
    lt: 69,
    odometer: 69,
    cost: 69
  }
])
const combDataTable = ref();

const manItems = ref([
  {
    _id: 30,
    date: '19/04/2024',
    vtr: '24',
    items: [
      {
        item: 'nada',
        price: 0,
      },
      {
        item: 'nada',
        price: 0,
      },
    ],
    totalCost: 0,
    tag: 'manutencao'
  },
  {
    _id: 31,
    date: '19/04/2024',
    vtr: '24',
    items: [
      {
        item: 'tudo',
        price: 0,
      },
      {
        item: 'tudo',
        price: 0,
      },
    ],
    totalCost: 0,
    tag: 'manutencao'
  },
])
const manDataTable = ref();
const manModal = ref(false)
const manEditItem = ref({})


ipcRenderer.send('requestData:Combustivel')
ipcRenderer.send('requestData:Manutencao')
ipcRenderer.on('requestData:res', (event, res, type) => {
  if (type == 'combustivel') {
    combItems.value = []
    console.log(res);
    convert.sortDate(res)
    res.forEach(data => {
      data.date = convert.convertDateToFormatString(data.date)
      combItems.value.push(data)
    });
  }

  //REMENBER THIS YOU IIIIIIIIIIIIIDIOT
  else if (type == 'manutencao') {
    manItems.value = []
    res.forEach(data => {
      data.date = convert.convertDateToFormatString(data.date)
      manItems.value.push(data)
    });
    console.log(manItems.value);
  }
})

//////////////////////////////////////////////////////

const changeTab = (tab) => {
  let pageOne = document.getElementById('pageOne')
  let pageTwo = document.getElementById('pageTwo')

  if (tab == 'comb') {
    pageOne.classList.remove('is-hidden')
    pageTwo.classList.add('is-hidden')
    return
  }
  pageTwo.classList.remove('is-hidden')
  pageOne.classList.add('is-hidden')
}
const logCurrentTableItems = () => {
  console.log(combDataTable.value.processedData);
}

const toggleColorScheme = (event) => {
  if (event.target.localName == 'span') {
    event.target.offsetParent.click()
    return
  }
  console.log(event);
  event.target.firstElementChild.classList.toggle('pi-moon')
  event.target.firstElementChild.classList.toggle('pi-sun')
  ipcRenderer.send('toggleTheme')
}

ipcRenderer.send('init:GetTheme');
ipcRenderer.on('init:RecieveTheme', (event, theme) => {
  let icon;
  let element = document.getElementById('themeBtn').firstElementChild.classList
  if (theme == 'light') icon = 'pi-sun'
  else { icon = 'pi-moon' }
  element.add(icon)
  /* console.log(icon);console.log(element); */
});

///////////////////////////////////////////////////////////

const combEditingRows = ref([]);

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
  { label: 'VTR 41' },
])

const filters = ref({
  date: { value: /* null */convert.convertDateToFormatString(new Date).slice(3), matchMode: FilterMatchMode.CONTAINS },
  vtr: { value: null, matchMode: FilterMatchMode.EQUALS },
});

const onRowEditSave = (event, type, manEditItemData) => {
  //console.log(event)
  let { newData, index } = event;
  let data;

  if (type == 'combustivel') {

    combItems.value[index] = { ...newData };
    data = JSON.stringify(combItems.value[index])
  }
  else if (type == 'manutencao') {
    index = manItems.value.findIndex((obj) => {
      return obj._id == manEditItemData._id
    })
    manItems.value[index] = { ...manEditItemData };
    manItems.value[index].items = []
    manEditItemData.items.forEach(item => {
      manItems.value[index].items.push({ ...item })
    })
    data = JSON.stringify(manItems.value[index])
    /* console.log(manItems.value[index]); */
  }
  ipcRenderer.send('requestSave', data, 'update');
}

const removeRow = (event, obj, type) => {
  console.log(obj)
  /* console.log(combItems.value.indexOf(obj)); */
  if (type == 'combustivel') {
    combItems.value = combItems.value.filter(val => val._id !== obj._id);
    console.log(combItems.value);
  } else {
    manItems.value = manItems.value.filter(val => val._id !== obj._id);
  }
  obj = JSON.stringify(obj)
  ipcRenderer.send('requestRemove', obj)
}

const openEditManutItem = (event, data) => {
  manModal.value = !manModal.value
  manEditItem.value = { ...data }
  manEditItem.value.items = []
  data.items.forEach(item => {
    manEditItem.value.items.push({ ...item })
  })
  console.log(manEditItem.value.items);
  /* console.log(manEditItem.value, 'edit'); */
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
  manEditItem.value.totalCost = 0
  items.forEach(item => {
    manEditItem.value.totalCost += item.price
  })
}

const clearForm = () => {
  return
  manEditItem.value = {
    _id: uuidv4(),
    date: new Date(),
    vtr: '',
    items: [
      {
        item: '',
        price: 0,
      },
    ],
    totalCost: 0,
    tag: 'manutencao'
  }
}
///////////////////////////////////////////////////////////

</script>

<style scoped>
.p-toolbar {
  border: 0
}

.p-inputtext {
  max-width: 130px;
}

.flex {
  display: flex;
}

.justify-content-end {
  justify-content: flex-end;
}
</style>
<style>
@import 'primeicons/primeicons.css';

html {
  overflow: auto;
}

body,
#app {
  height: 100vh;
}

#app {
  display: flex;
  flex-direction: column;
}

#app>#pageOne,
#app>#pageTwo {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

#themeBtn {
  position: absolute;
  top: 0.3rem;
  right: 0.3rem;
}

.p-datatable.p-component.p-datatable-responsive-scroll {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.p-datatable-wrapper {
  flex-grow: 1;
}

.p-inputnumber-input {
  max-width: 120px;
}

table .p-datatable-thead>tr>th {
  padding: 0.5rem 0.3rem;
}

.p-datatable .p-column-header-content {
  padding-left: 10px;
}

.input-number-editor input {
  width: 5rem;
}

@media (prefers-color-scheme: dark) {
  table>.p-datatable-tbody>tr.p-highlight {
    background: #191d27;
  }

  table>.p-datatable-tbody>tr.p-highlight>td {
    border-bottom-color: #aabeff;
  }

  #app .p-button-primary,
  .p-dialog .p-button-primary {
    color: #fff;
    background: #182447;
    border: 1px solid #182447;
  }

  #app .p-button-primary:not(:disabled):hover,
  .p-dialog .p-button-primary:not(:disabled):hover {
    color: #fff;
    background: #1b2e66;
    border: 1px solid #1b2e66;
  }

}

@media (prefers-color-scheme: light) {
  table>.p-datatable-tbody>tr.p-highlight {
    background: #c8d8ff;
  }

  table>.p-datatable-tbody>tr.p-highlight>td {
    border-bottom-color: #191d27;
  }

  #app .p-button-primary,
  .p-dialog .p-button-primary {
    color: #334155;
    background: #ddd;
    border: 1px solid #ddd;
  }

  #app .p-button-primary:not(:disabled):hover,
  .p-dialog .p-button-primary:not(:disabled):hover {
    color: #334155;
    background: #cccccc;
    border: 1px solid #cccccc;
  }
}
</style>