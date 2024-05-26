<template>
  <Toast position="bottom-right" />
  <ConfirmDialog />
  <Tabs @tab="changeTab" />
  <Config id="configMenu" v-if="toggleConfigMenu" @closeMenu="toggleMenu" v-model:vtrList="vtrList"
    @removeVTR="removeVTR" @saveVTR="saveVTR" @migrarVtr="migrarVtr" @populateVTR="populateVTR"
    @requestCombustivelData="requestCombustivelData" />

  <Button icon="pi" id="themeBtn" @click="toggleColorScheme" severity="contrast" rounded="true" outlined="true" />
  <Button icon="pi pi-cog" id="configBtn" @click="toggleMenu" severity="contrast" rounded="true" outlined="true" />

  <div id="pageOne">
    <CustomToolbar type="combustivel" :combDataTable="combDataTable" :combHasVTRFilter="combHasVTRFilter"
      :combHasDateFilter="combHasDateFilter" :vtrList="vtrList" @openModal="handleModalVisibility" />
    <CustomModal type="combustivel" :combDataTable="combDataTable" :vtrList="vtrList"
      v-model:modalVisible="combModalVisible" @closeModal="handleModalVisibility" v-if="combModalVisible"
      @requestCombustivelData="requestCombustivelData" />

    <!-- <Button label="Log displayed items" icon="pi pi-exclamation-circle" severity="danger" style="width: 15rem"
      @click="logCurrentTableItems" /> -->

    <DataTable ref="combDataTable" :value="combItems" dataKey="id" v-model:editingRows="combEditingRows" editMode="row"
      v-model:selection="combEditingRows" @row-edit-save="onRowEditSave($event, 'combustivel')"
      @row-edit-cancel="console.log($event)" @update:filters="handleFilters($event, 'combustivel')"
      v-model:filters="filters" filterDisplay="row">

      <Column field="timestamp" header="Data" style="width: 20%">
        <template #editor="{ data, field }">
          <Calendar v-model="data[field]" dateFormat="dd/mm/yy" mask="99/99/9999"
            @update:modelValue="data[field] = convert.convertDateToFormatString($event)" />
        </template>
        <template #filter="{ filterModel, filterCallback }">
          <Calendar v-model="filterModel.value" view="month" dateFormat="mm/yy" @date-select="filterModel.value = convert.convertDateToFormatString($event).slice(3),
            filterCallback()" selectionMode="range" style="min-width: 13rem" />
        </template>
      </Column>

      <Column field="vtr" header="VTR" style="width: 15%">
        <template #editor="{ data, field }">
          <Dropdown v-model="data[field]" :options="vtrList" optionLabel="vtr" optionValue="vtr"
            :placeholder="data[field]" />
        </template>
        <template #filter="{ filterModel, filterCallback }">
          <Dropdown v-model="filterModel.value" @change="filterCallback()" :options="vtrList" optionLabel="vtr"
            optionValue="vtr" placeholder="VTR" class="p-column-filter" style="min-width: 7.2rem" />
        </template>
      </Column>

      <Column field="lt" header="Lt" style="width: 15%">
        <template #editor="{ data, field }">
          <InputNumber v-model="data[field]" :minFractionDigits="3" :maxFractionDigits="3" style="width: 6.5rem"
            class="input-number-editor" />
        </template>
      </Column>

      <Column field="odometer" header="Odômetro" style="width: 15%">
        <template #editor="{ data, field }">
          <InputNumber v-model="data[field]" :useGrouping="false" locale="pt-BR" style="width: 6rem"
            class="input-number-editor" />
        </template>
      </Column>

      <Column field="price" header="Valor" style="width: 15%">
        <template #body="{ data, field }">
          {{ convert.formatCurrency(data[field]) }}
        </template>
        <template #editor="{ data, field }">
          <InputNumber v-model="data[field]" mode="currency" currency="BRL" style="width: 6rem" />
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
    <CustomToolbar type="manutencao" :manDataTable="manDataTable" :manHasVTRFilter="manHasVTRFilter"
      :manHasDateFilter="manHasDateFilter" :vtrList="vtrList" @importResExcel="importResExcel"
      @manutencaoExportState="setManState" />

    <DataTable ref="manDataTable" :value="manItems" dataKey="_id" @update:filters="handleFilters($event, 'manutencao')"
      v-model:filters="filtersMan" filterDisplay="row">

      <Column field="vtr" header="VTR" style="width: 15%">
        <template #filter="{ filterModel, filterCallback }">
          <Dropdown v-model="filterModel.value" @change="filterCallback()" :options="vtrList" optionLabel="vtr"
            optionValue="vtr" placeholder="VTR" class="p-column-filter" style="min-width: 7.2rem" />
        </template>
      </Column>

      <Column field="date" header="Data" style="width: 20%">
      </Column>

      <Column field="items" header="Itens" style="width: 30%">
        <template #body="{ data, field }">
          <div v-for="item in data[field]">
            {{ item.name }} {{ convert.formatCurrency(item.price) }}
          </div>
        </template>
      </Column>

      <Column field="totalCost" header="Valor" style="width: 20%">
        <template #body="{ data, field }">
          {{ convert.formatCurrency(data[field]) }}
        </template>
      </Column>
    </DataTable>
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
  import InputNumber from 'primevue/inputnumber';
  import Dropdown from 'primevue/dropdown';
  import ConfirmDialog from 'primevue/confirmdialog';
  import { useConfirm } from "primevue/useconfirm";
  import Toast from 'primevue/toast';
  import { useToast } from 'primevue/usetoast';

  //CUSTOM COMPONENTS
  import Tabs from './components/Tabs.vue';
  import CustomModal from './components/Modal.vue';
  import CustomToolbar from './components/Toolbar.vue'
  import Config from './components/Config.vue';

  //SCRIPTS
  import { convert } from './scripts/convert';

  const ipcRenderer = window.electron.ipcRenderer
  const confirm = useConfirm()
  const toast = useToast();

  const combItems = ref([
    /* {
      _id: 69,
      date: '19/04/2024',
      vtr: 'VTR 24',
      driver: 'easter egg do marcelinho',
      lt: 69,
      odometer: 69,
      cost: 69
    } */
  ])
  const combDataTable = ref();
  const combEditingRows = ref([]);

  const manItems = ref([
    /* {
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
    }, */
  ])
  const manDataTable = ref();

  onMounted(() => {
    requestCombustivelData()
  })

  const requestCombustivelData = () => {
    ipcRenderer.invoke('requestData:Combustivel').then(res => {
      combItems.value = []
      convert.sortDate(res)
      res.forEach(data => {
        data.timestamp = convert.convertDateToFormatString(data.timestamp)
        combItems.value.push(data)
      });
      console.log(combItems.value);
    })
  }

  ipcRenderer.on('reloadData', () => {
    requestCombustivelData()
    populateVTR()
  })

  ipcRenderer.on('requestStatus', (event, result) => {
    switch (result) {
      case 'synced':
        toast.add({ severity: 'info', detail: 'Seus dados estão em dia', life: 2000 })
        break;
      case 'reload':
        toast.add({ severity: 'success', detail: 'Dados sincronizados da nuvem', life: 2000 })
        break;
      case 'sent':
        toast.add({ severity: 'success', detail: 'Dados enviados para nuvem', life: 2000 })
        break;
      case 'error':
        toast.add({ severity: 'error', detail: 'Houve um erro no contato com o servidor', life: 4000 })
        break;
    }

  })


  const importResExcel = (data) => {
    //console.log(data);
    manItems.value = []
    data.forEach(item => {
      manItems.value.push(item)
    })
    console.log(manItems.value);
  }

  //////////////////////////////////////////////////////

  const activeTab = ref('comb')
  const changeTab = (tab) => {
    let pageOne = document.getElementById('pageOne').classList
    let pageTwo = document.getElementById('pageTwo').classList

    if (tab != activeTab.value) {
      pageOne.toggle('is-hidden')
      pageTwo.toggle('is-hidden')
      activeTab.value = tab
    }
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

  const toggleConfigMenu = ref(false)
  const toggleMenu = (event) => {
    toggleConfigMenu.value = !toggleConfigMenu.value
  }

  onMounted(() => {
    ipcRenderer.invoke('init:GetTheme').then(theme => {
      let icon;
      let element = document.getElementById('themeBtn').firstElementChild.classList
      if (theme == 'light') icon = 'pi-sun'
      else { icon = 'pi-moon' }
      element.add(icon)
    });
  })

  const combModalVisible = ref(false)
  const handleModalVisibility = (value) => {
    combModalVisible.value = value
  }
  ///////////////////////////////////////////////////////////
  const vtrList = ref([])

  const populateVTR = () => {
    ipcRenderer.invoke('populateVTR').then(res => {
      vtrList.value = res
      console.log(vtrList.value);
      vtrList.value = vtrList.value.sort((a, b) => a.vtr.localeCompare(b.vtr))
    })
  }
  populateVTR()

  const removeVTR = (data) => {
    vtrList.value = vtrList.value.filter(val => val.id !== data.id);
    console.log(data);
    ipcRenderer.send('deleteEntry', 'VTR', JSON.stringify([data]))
  }

  const saveVTR = (oldData, newdata) => {
    vtrList.value = vtrList.value.filter(val => val.id !== newdata.id);
    vtrList.value.push(newdata)
    vtrList.value = vtrList.value.sort((a, b) => a.vtr.localeCompare(b.vtr))

    ipcRenderer.send('updateVTR', JSON.stringify(oldData), JSON.stringify(newdata))
    ipcRenderer.send('updateFaturas', JSON.stringify(oldData), JSON.stringify(newdata))
    populateVTR()
  }

  const migrarVtr = (oldData, newdata) => {
    ipcRenderer.send('updateFaturas', JSON.stringify(oldData), JSON.stringify(newdata), 'migrar')
    populateVTR()
  }

  const onRowEditSave = (event) => {
    let { newData, index } = event;
    let oldData = combItems.value[index]
    combItems.value[index] = { ...newData };
    newData.timestamp = convert.convertDateToMilliseconds(newData.timestamp)
    ipcRenderer.send('updateFaturas', JSON.stringify(oldData), JSON.stringify(newData))
  }

  const removeRow = (event, obj) => {
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
        combItems.value = combItems.value.filter(item => item.id !== obj.id);
        console.log(combItems.value);
        obj = JSON.stringify([obj])
        ipcRenderer.send('deleteEntry', 'Faturas', obj)
      }
    })
  }

  const filters = ref({
    timestamp: { value: convert.convertDateToFormatString(new Date).slice(3), matchMode: FilterMatchMode.CONTAINS },
    vtr: { value: null, matchMode: FilterMatchMode.EQUALS },
  });
  const filtersMan = ref({
    vtr: { value: null, matchMode: FilterMatchMode.EQUALS },
  });

  const combHasDateFilter = ref({ timestamp: null, state: false })
  const combHasVTRFilter = ref({ vtr: null, state: false })
  const manHasDateFilter = ref()
  const manHasVTRFilter = ref({ vtr: null, state: false })
  const setManState = (date, vtr) => {
    manHasDateFilter.value = date
  }
  const handleFilters = (event, type) => {
    console.log(event);
    if (type === 'combustivel') {
      if (event.timestamp.value) {
        combHasDateFilter.value.state = true
        combHasDateFilter.value.timestamp = convert.formatMonthString(event.timestamp.value)
      }
      else {
        combHasDateFilter.value.state = false
        combHasDateFilter.value.timestamp = null
      }
      if (event.vtr.value) {
        combHasVTRFilter.value.state = true
        combHasVTRFilter.value.vtr = event.vtr.value
      }
      else {
        combHasVTRFilter.value.state = false
        combHasVTRFilter.value.vtr = event.vtr.value
      }
      console.log(combHasDateFilter.value);
      console.log(combHasVTRFilter.value);
      return
    }

    if (event.vtr.value) {
      manHasVTRFilter.value.state = true
      manHasVTRFilter.value.vtr = event.vtr.value
    }
    else {
      manHasVTRFilter.value.state = false
      manHasVTRFilter.value.vtr = event.vtr.value
    }
    console.log(manHasDateFilter.value);
    console.log(manHasVTRFilter.value);
  }
  ///////////////////////////////////////////////////////////

</script>

<style scoped>
  .p-toolbar {
    border: 0;
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
    overflow: hidden;
  }

  body,
  #app {
    height: 100vh;
  }

  #app {
    display: flex;
    flex-direction: column;
  }

  #app>.card {
    margin: 0;
    box-shadow: none;
  }

  #app>#pageOne,
  #app>#pageTwo {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    overflow: auto
  }

  #configBtn {
    position: absolute;
    top: 0.3rem;
    right: 0.3rem;
  }

  #themeBtn {
    position: absolute;
    top: 0.3rem;
    right: 3.6rem;
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
      background: #1e1e23;
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

    #app .p-tabmenuitem.p-highlight .p-menuitem-link {
      color: #fff;
    }

    #app .p-tabmenu-ink-bar {
      background-color: #fff;
    }

    #app .p-inputtext:enabled:focus {
      border-color: #fff;
    }

    #app .p-dropdown:not(.p-disabled).p-focus {
      border-color: #fff;
    }

    #app .p-column-filter-menu-button.p-column-filter-menu-button-active,
    .p-column-filter-menu-button.p-column-filter-menu-button-active:hover {
      color: #000;
      background: #ffffffb8;
    }

    #app .p-datatable-tbody>tr:has(+ .p-highlight)>td {
      border-bottom-color: #fff;
    }

    .p-dropdown-items-wrapper ul .p-highlight {
      background: #ddd;
      color: #000;
    }

    .p-dropdown-items-wrapper ul .p-highlight.p-focus {
      background: #ddd;
      color: #000;
    }

  }

  @media (prefers-color-scheme: light) {
    table>.p-datatable-tbody>tr.p-highlight {
      background: #ccc;
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

    #app .p-tabmenuitem.p-highlight .p-menuitem-link {
      color: #000;
    }

    #app .p-tabmenu-ink-bar {
      background-color: #000;
    }

    #app .p-inputtext:enabled:focus {
      border-color: #000;
    }

    #app .p-dropdown:not(.p-disabled).p-focus {
      border-color: #000;
    }

    #app .p-column-filter-menu-button.p-column-filter-menu-button-active,
    .p-column-filter-menu-button.p-column-filter-menu-button-active:hover {
      color: #fff;
      background: #000000b8;
    }

    #app .p-datatable-tbody>tr.p-highlight .p-row-editor-save:hover,
    #app .p-datatable-tbody>tr.p-highlight .p-row-editor-cancel:hover {
      color: #000;
    }

    #app .p-datatable-tbody>tr:has(+ .p-highlight)>td {
      border-bottom-color: #000;
    }

    .p-dropdown-items-wrapper ul .p-highlight {
      background: #333;
      color: #fff;
    }

    .p-dropdown-items-wrapper ul .p-highlight.p-focus {
      background: #333;
      color: #fff;
    }
  }
</style>