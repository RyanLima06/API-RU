# Saldo do RU

Sistema de consulta de saldo e recarga para Restaurante Universitário, dividido em:

- **`backend/`**: API em Node.js (Express) e MySQL que consulta saldo, foto e QR code dos alunos e registra recargas.
- **`frontend/`**: interface em React (Vite) com a carteirinha digital do aluno e a tela de recarga do operador.
- **`nginx/`**: proxy reverso responsável pelo roteamento entre frontend e API, HTTPS e cabeçalhos de segurança.

---

## Como o acesso funciona

| Rota (via `/api` no Docker) | Quem usa | Proteção |
| :--- | :--- | :--- |
| `POST /web/saldo` | Estudante (site) | Sem login. Limite de 15 consultas/minuto por IP |
| `POST /web/login` | Operador (site) | Limite de 8 tentativas a cada 15 minutos por IP |
| `POST /web/recarga` | Operador (site) | Autenticação via token JWT (`Authorization: Bearer`) |
| `POST /saldo` | Sistemas (catraca/integrações) | Chave de API (`X-API-Key`) |
| `POST /recarga` | Sistemas (catraca/integrações) | Chave de API (`X-API-Key`) |

### Páginas do Frontend

| Endereço | Finalidade | Acesso |
| :--- | :--- | :--- |
| `/` | Consulta de saldo (carteirinha) | Livre (apenas matrícula) |
| `/login` | Autenticação do operador | Livre |
| `/recarga` | Registro de recargas | Restrito a operador autenticado |

---

## Opção 1: Rodar com Docker (Recomendado)

### Pré-requisitos
- **Docker** e **Docker Compose**
- **Git**

### 1. Clonar e configurar variáveis
```bash
git clone <url-do-repositorio>
cd Saldo-do-RU
cp .env.example .env
```
Preencha as senhas e chaves no arquivo `.env` da raiz (use `openssl rand -hex 32` para gerar chaves fortes).

### 2. Gerar certificado HTTPS local
**Linux / Mac / Git Bash:**
```bash
mkdir -p nginx/certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/certs/key.pem \
  -out nginx/certs/cert.pem \
  -subj "/CN=localhost"
```

**Windows (PowerShell):**
```powershell
mkdir -Force nginx/certs; docker run --rm -v "${PWD}/nginx/certs:/certs" alpine/openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /certs/key.pem -out /certs/cert.pem -subj "/CN=localhost"
```

### 3. Subir e acessar
```bash
docker compose up -d --build
```
Acesse **`https://localhost:8443`** no navegador e aceite o aviso de certificado autoassinado.

### Comandos úteis (Docker)
- **Criar novo operador:** `docker compose exec backend node src/criarOperador.js <usuario> "<Nome>" <senha>`
- **Acompanhar logs:** `docker compose logs -f`
- **Parar serviços:** `docker compose down`

---

## Opção 2: Rodar localmente sem Docker

### Pré-requisitos
- **Node.js** (v18 ou superior)
- **MySQL Server** rodando localmente

### 1. Configurar e iniciar o Backend
Acesse a pasta `backend/`, instale as dependências e crie o arquivo `backend/.env` baseado no `.env.example` da raiz (ajustando `DB_HOST=localhost` e `FRONTEND_ORIGIN=http://localhost:5173`):

```bash
cd backend
npm install
```

Execute o setup para criar e popular o banco de dados e inicie a API:
```bash
node src/models/setup.js
node src/appRU.js
```

*(Opcional) Para criar operadores adicionais:*
```bash
node src/criarOperador.js <usuario> "<Nome>" <senha>
```

### 2. Configurar e iniciar o Frontend
Em outro terminal, acesse a pasta `frontend/`, instale as dependências e crie o arquivo `frontend/.env` apontando diretamente para a porta do backend:

```env
VITE_API_URL=http://localhost:8080
```

Instale e rode o servidor de desenvolvimento:
```bash
cd frontend
npm install
npm run dev
```

Acesse **`http://localhost:5173`** no navegador.

---

## Estrutura do projeto

```text
Saldo-do-RU/
├── backend/                 # API Node.js + Express
│   ├── src/
│   │   ├── controllers/     # Lógica de saldo, recarga e autenticação
│   │   ├── middleweares/    # Validação de JWT e chave de API
│   │   ├── models/          # Schema SQL, seeds e script de setup
│   │   ├── appRU.js         # Inicialização do servidor Express
│   │   ├── criarOperador.js # CLI para cadastro de operadores
│   │   ├── db.js            # Conexão com o MySQL
│   │   └── routes.js        # Definição de rotas, CORS e rate limit
│   └── Dockerfile
├── frontend/                # Interface React + Vite
│   ├── src/
│   │   ├── pages/           # Telas Home, Login e Recarga
│   │   └── services/        # Cliente HTTP e controle de sessão
│   └── Dockerfile
├── nginx/
│   ├── certs/               # Certificados SSL locais (não versionados)
│   └── default.conf         # Configuração de proxy reverso e HTTPS
├── .env                     # Variáveis de ambiente locais (não versionado)
├── .env.example             # Modelo de variáveis de ambiente
├── .gitignore
├── docker-compose.yaml
└── README.md
```

---

## Segurança

- **Isolamento de credenciais:** Nenhuma senha, chave de API ou certificado privado é versionado no Git (`.env` e `nginx/certs/` estão protegidos pelo `.gitignore`).
- **HTTPS e cabeçalhos:** No Docker, o Nginx força redirecionamento para HTTPS e aplica cabeçalhos de proteção (`X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection` e `Referrer-Policy`).
- **Privilégio mínimo no banco:** A API opera com um usuário restrito ao banco da aplicação, separando as permissões administrativas usadas apenas no setup.
- **Proteção contra abuso:** Rotas públicas e de login possuem *rate limiting* por IP e senhas são armazenadas com hash `bcrypt`.
