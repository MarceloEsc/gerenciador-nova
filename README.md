## Gerenciador Nova

Um projeto electron-vite para gerenciar faturas
Dados são salvos com SQLite3 e sincronizados na nuvem com o serviço da cloudflare D1 e KV
Backend: [https://github.com/MarceloEsc/nova-d1-db-sync](https://github.com/MarceloEsc/nova-d1-db-sync)

Usando pdfreader e exceljs o programa lê os dados dos arquivos para salvar e apresenta-los
Front-end feito em Vue.js 3, usando a biblioteca de componentes primevue

Atualização automatica com electron-updater e o releases do github

`npm intall`

`npm run dev`

`npm run publish`