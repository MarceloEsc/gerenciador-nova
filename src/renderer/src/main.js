/* import './assets/main.css' */
import './assets/bulma.min.css'

import { createApp } from 'vue'
import App from './App.vue'
import PrimeVue from 'primevue/config';
import PrimeVueStyled from 'primevue/styled'
import PrimeOne from 'primevue/themes/primeone';
import Aura from 'primevue/themes/primeone/aura';
import ToastService from 'primevue/toastservice';
import ConfirmationService from 'primevue/confirmationservice';
import ptBr from './assets/pt-br.json';


const app = createApp(App)
app.use(PrimeVue, {
      locale: ptBr['pt-br'],
      theme: {
            base: PrimeOne,
            preset: Aura,
            options: {
                  darkModeSelector: 'system',
            }
      }
})
app.use(ToastService);
app.use(ConfirmationService)
app.mount('#app')

