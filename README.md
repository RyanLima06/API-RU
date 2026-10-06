# Saldo do RU

Projeto com dois lados:
- **`backend/`** — API em Node.js que consulta saldo, foto e QR code dos alunos no banco.
- **`frontend/`** — interface em React (Vite) que mostra a "carteirinha digital" do aluno.

## Pré-requisitos

- [Node.js](https://nodejs.org/) (18+)
- [MySQL Server](https://dev.mysql.com/downloads/installer/) rodando localmente
- [MySQL Workbench](https://dev.mysql.com/downloads/workbench/) (opcional, para inspecionar o banco)
- [Git](https://git-scm.com/downloads)

## 1. Clonar o projeto

```bash
git clone <url-do-repositorio>
cd Saldo-do-RU
```

---

## 2. Backend

### 2.1 Instalar as dependências

```bash
cd backend
npm install
```

### 2.2 Configurar as variáveis de ambiente

Crie um .env e depois abra o `backend/.env` e preencha:

```dotenv
DB_HOST=localhost
DB_USER=ru_app
DB_PASS=escolha_uma_senha_forte
DB_NAME=ru_teste
API_KEY=senha-da-api-aqui

DB_SETUP_USER=root
DB_SETUP_PASS=senha_do_seu_root
```

>`DB_SETUP_USER`/`DB_SETUP_PASS` só são usados pelo script de setup, para criar o banco e as tabelas — a aplicação em si usa sempre `DB_USER`/`DB_PASS` (`ru_app`).

### 2.3 Criar e popular o banco (setup) (O usuário `ru_app` no MySQL é criado automaticamente ao rodar o setup)

```bash
node src/models/setup.js
```

Esse script:
- conecta como `DB_SETUP_USER` (root);
- executa `src/models/ruTeste.schema.sql`, que **apaga e recria** o banco `ru_teste` com as tabelas `alunos`, `saldos` e `qrcodes`;
- executa `src/models/ruTeste.seeds.sql`, que insere 20 alunos fictícios para teste.

Pode ser rodado quantas vezes quiser para resetar os dados de teste.

### 2.4 Rodar o backend

```bash
node src/appRU.js
```

A aplicação se conecta ao banco usando `DB_USER`/`DB_PASS` (`ru_app`), nunca o `root`. Por padrão sobe em `http://localhost:3000` (ajuste se a porta configurada em `src/appRU.js` for outra).

---

## 3. Frontend

### 3.1 Instalar as dependências

Em outro terminal, a partir da raiz do projeto:

```bash
cd frontend
npm install
```

### 3.2 Configurar as variáveis de ambiente

O frontend lê a URL da API via `import.meta.env.VITE_API_URL`. Crie um `.env` dentro de `frontend/`:

```dotenv
VITE_API_URL=url-da-api-do-backend-aqui
```

### 3.3 Rodar o frontend

```bash
npm run dev
```

O terminal mostra o endereço local (normalmente `http://localhost:5173`).

---

## Estrutura do projeto

```
Saldo-do-RU/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── SaldoAlunosController.js
│   │   ├── middlewares/
│   │   ├── models/
│   │   │   ├── ruTeste.schema.sql   # cria o banco e as tabelas
│   │   │   ├── ruTeste.seeds.sql    # popula com dados fictícios
│   │   │   └── setup.js             # roda schema + seed
│   │   ├── appRU.js                 # ponto de entrada da API
│   │   ├── db.js                    # conexão com o MySQL (usa ru_app)
│   │   └── routes.js
│   ├── .env                         # credenciais locais (NÃO vai para o Git)
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── pages/
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env                         # NÃO vai para o Git
│   ├── .env.example
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── .gitignore                       # um só, cobre backend e frontend
├── .gitattributes
└── README.md
```

## Segurança

- Nenhuma senha ou chave fica no código: tudo vem dos arquivos `.env` (um em `backend/`, outro em `frontend/`).
- Os `.env` estão no `.gitignore` e nunca devem ser commitados.
- O backend usa o usuário `ru_app`, com permissão apenas no banco `ru_teste` — nunca o `root`.
