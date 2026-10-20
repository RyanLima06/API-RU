# Saldo do RU

Projeto com dois lados:
- **`backend/`**: API em Node.js que consulta saldo, foto e QR code dos alunos e registra recargas.
- **`frontend/`**: interface em React (Vite) com a "carteirinha digital" do aluno e a tela de recarga do operador.

## Como o acesso funciona

Cada tipo de cliente tem a sua proteção:

| Rota | Quem usa | Proteção |
|---|---|---|
| `POST /web/saldo` | Estudante (site) | Sem login. Limite de 15 consultas por minuto por IP |
| `POST /web/login` | Operador (site) | Limite de 8 tentativas a cada 15 minutos por IP |
| `POST /web/recarga` | Operador (site) | Login (token JWT no header `Authorization: Bearer`) |
| `POST /saldo` | Sistemas (catraca, integrações) | Chave de API (header `X-API-Key`) |
| `POST /recarga` | Sistemas (catraca, integrações) | Chave de API (header `X-API-Key`) |

O estudante continua só digitando a matrícula. O login existe apenas na tela de recarga. A chave de API **não vai mais para o frontend**: ela é usada só por sistemas que falam direto com a API.

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

Se alguma dependência nova não for instalada pelo `npm install`, instale manualmente:

```bash
npm i bcryptjs jsonwebtoken express-rate-limit
```

### 2.2 Configurar as variáveis de ambiente

Copie o `.env.example` para `backend/.env` (fora do `/src`) e preencha:

```dotenv
# Banco (usuário da aplicação)
DB_HOST=localhost
DB_USER=ru_user
DB_PASS=senha-aqui
DB_NAME=ru_teste

# Banco (usuário administrador, usado só pelo setup e pelo criar-operador)
DB_SETUP_USER=root
DB_SETUP_PASS=senha_do_seu_root

# Segurança
API_KEY=chave-para-sistemas-externos
JWT_SECRET=string-aleatoria-longa

# Origem do frontend permitida no CORS
FRONTEND_ORIGIN=http://localhost:5173

# Operador inicial (criado pelo setup)
ADMIN_USUARIO=admin
ADMIN_NOME=Administrador
ADMIN_SENHA=senha-forte-aqui
```

Para gerar o `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

> `DB_SETUP_USER`/`DB_SETUP_PASS` só são usados pelo setup e pelo script de criar operador. A aplicação em si usa sempre `DB_USER`/`DB_PASS`.
>
> `ADMIN_SENHA` precisa ter pelo menos 8 caracteres. Se `ADMIN_USUARIO` ou `ADMIN_SENHA` ficarem vazios, o setup não cria nenhum operador.

### 2.3 Criar e popular o banco (setup)

```bash
node src/models/setup.js
```

Esse script:
- conecta como `DB_SETUP_USER`;
- executa `src/models/ruTeste.schema.sql`, que **apaga e recria** o banco `ru_teste` com as tabelas `alunos`, `saldos`, `qrcodes`, `logs_alteracoes` e `operadores`;
- executa `src/models/ruTeste.seeds.sql`, que insere 20 alunos fictícios para teste;
- cria o operador inicial com os dados de `ADMIN_USUARIO`, `ADMIN_NOME` e `ADMIN_SENHA` ( o ideal é a senha ser guardada com hash bcrypt, nunca em texto, mas por ser teste, não está implementado ainda.).

### 2.4 Criar mais operadores

Com o backend configurado, dentro de `backend/`:

```bash
node src/criarOperador.js maria "Maria Silva" senhaForte123
```

Formato: `<usuario> "<Nome completo>" <senha>`. A senha precisa ter pelo menos 8 caracteres. Se preferir, confira se não existe um atalho já `package.sjon`, caso contrário, adicione um atalho no `package.json`:

```json
"scripts": {
  "criar-operador": "node src/criarOperador.js"
}
```

e use `npm run criar-operador -- maria "Maria Silva" senhaForte123` (o `--` é necessário para repassar os argumentos).

Para listar os operadores existentes:

```sql
SELECT id, usuario, nome, ativo FROM ru_teste.operadores;
```

Para desativar um operador sem apagá-lo, coloque `ativo = 0`.

### 2.5 Rodar o backend

```bash
node src/appRU.js
```

Sobe em `http://localhost:3000` por padrão (ajuste se a porta configurada em `src/appRU.js` for outra). O Node não recarrega sozinho: depois de alterar o código, pare (Ctrl+C) e suba de novo, ou use `node --watch src/appRU.js` em desenvolvimento.

Se o backend ficar atrás de um proxy (Nginx, Cloudflare etc.), adicione `app.set("trust proxy", 1);` no `appRU.js`, antes das rotas. Sem isso, o limite de requisições enxerga o IP do proxy e bloqueia todos os usuários juntos.

---

## 3. Frontend

### 3.1 Instalar as dependências

Em outro terminal, a partir da raiz do projeto:

```bash
cd frontend
npm install
```

### 3.2 Configurar as variáveis de ambiente

Crie um `.env` dentro de `frontend/`:

```dotenv
VITE_API_URL=http://localhost:3000
```

> **Não coloque a chave de API aqui.** Tudo que começa com `VITE_` vai para o código entregue ao navegador e fica visível para qualquer pessoa. A `VITE_API_KEY` foi removida do projeto. Se você usou uma chave nela antes, troque o valor de `API_KEY` no backend.

### 3.3 Rodar o frontend

```bash
npm run dev
```

O terminal mostra o endereço local (normalmente `http://localhost:5173`). O Vite só lê o `.env` ao iniciar, então reinicie-o se alterar a `VITE_API_URL`.

### 3.4 Páginas

| Endereço | Para quê | Acesso |
|---|---|---|
| `/` | Consulta de saldo (carteirinha) | Livre, o aluno digita a matrícula |
| `/login` | Entrada do operador | Livre |
| `/recarga` | Registrar recargas | Só operador logado; sem sessão, redireciona para `/login` |

Não há link para o `/login` na home, de propósito. O operador acessa `/recarga` (ou salva nos favoritos) e é levado ao login se precisar.

A sessão do operador fica no `sessionStorage` e dura até 8 horas ou até fechar a aba. O botão "Sair" na tela de recarga encerra a sessão.

---

## Estrutura do projeto

```
Saldo-do-RU/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── AuthController.js          # login do operador (gera o JWT)
│   │   │   ├── RecargaController.js       # recarga de saldo + log
│   │   │   └── SaldoAlunosController.js   # consulta de saldo
│   │   ├── middleweares/
│   │   │   ├── verificarChaveApi.js       # chave de API (sistemas)
│   │   │   └── verificarOperador.js       # valida o JWT (operador)
│   │   ├── models/
│   │   │   ├── ruTeste.schema.sql         # cria o banco e as tabelas
│   │   │   ├── ruTeste.seeds.sql          # popula com dados fictícios
│   │   │   └── setup.js                   # roda schema + seed + operador inicial
│   │   ├── appRU.js                       # ponto de entrada da API
│   │   ├── criarOperador.js               # script para criar operadores
│   │   ├── db.js                          # conexão com o MySQL (usa ru_user)
│   │   └── routes.js                      # rotas, CORS e rate limit
│   ├── .env                               # credenciais locais (NÃO vai para o Git)
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── pages/
│   │   │   ├── home/                      # consulta de saldo (aluno)
│   │   │   ├── login/                     # login do operador
│   │   │   └── recarga/                   # recarga (operador logado)
│   │   ├── services/
│   │   │   └── api.js                     # chamadas à API e sessão do operador
│   │   ├── App.jsx                        # rotas do React
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env                               # NÃO vai para o Git
│   ├── .env.example
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── .gitignore                             # um só, cobre backend e frontend
├── .gitattributes
└── README.md
```

## Segurança

- Nenhuma senha ou chave fica no código: tudo vem dos arquivos `.env` (um em `backend/`, outro em `frontend/`), que estão no `.gitignore` e nunca devem ser commitados.
- A chave de API (`API_KEY`) é só para sistemas externos e nunca vai para o navegador.
- A recarga exige login de operador. O nome do operador gravado no log vem do token, não do que o navegador envia.
- Senhas de operadores são guardadas com hash `bcrypt`; o login responde igual para usuário inexistente e senha errada.
- A consulta de saldo é pública, mas tem limite de requisições por IP para dificultar a varredura de matrículas.
- O backend usa o usuário `ru_user`, com permissão apenas no banco `ru_teste`, nunca o `root`. O `root` (ou outro administrador) só é usado pelo setup e pelo `criarOperador.js`.
- Em produção, use HTTPS. Sem ele, senha e token trafegam em texto puro.
- Ponto de atenção: a consulta pública devolve nome, saldo, foto e QR code a quem souber a matrícula. Se o QR code servir para entrar no RU, avalie devolver só nome e saldo, ou pedir um dado extra além da matrícula.