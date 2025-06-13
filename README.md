# 🐾 Pets Up – API (Back-End)

Este é o repositório responsável pelo back-end do projeto **Pets Up**, uma plataforma de adoção responsável de animais desenvolvida como trabalho de conclusão de curso (TCC).

## 🚀 Tecnologias Utilizadas

- Node.js + TypeScript
- Express.js
- SQLite (banco de dados local)
- Yarn (gerenciador de pacotes)

---

## 📦 Instalação

1. **Clone o repositório:**

```bash
git clone https://github.com/GabrielPdoCarmo/TCC---Back.git
cd TCC---Back
```

2. **Instale as dependências:**

```bash
yarn
# ou, alternativamente
npm install
```

3. **Configure o banco de dados:**

> Certifique-se de ter um banco de dados local chamado `adocao_animais`.  
O banco será populado automaticamente com dados de exemplo ao rodar o projeto.

---

## ▶️ Como rodar o projeto

```bash
yarn dev
```

Após iniciar o servidor, aguarde enquanto os dados iniciais são inseridos automaticamente nas tabelas.

---

## ✅ Funcionalidades disponíveis

A API permite as seguintes operações:

### 📌 Criação:
- Usuários
- Pets
- Favoritos
> ⚠️ As demais entidades já possuem dados pré-populados automaticamente no banco (exceto doenças, que são geradas ao criar um pet).

### 🔁 Leitura, Atualização e Exclusão:
- Permitidos para as tabelas disponíveis.

Você pode testar os endpoints com ferramentas como **Postman**, **Insomnia** ou **Thunder Client**.

---

## 📁 Estrutura do Projeto

```
📦 src/
 ┣ 📂 controllers/
 ┣ 📂 services/
 ┣ 📂 routes/
 ┣ 📂 database/
 ┗ 📜 server.ts
```
---

## 👨‍💻 Autor

Gabriel Pereira do Carmo  
📧 gabrielcarmobr14@gmail.com
