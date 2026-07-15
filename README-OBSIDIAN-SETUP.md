# Instalação do Obsidian neste projeto

## 1. Extraia este pacote na raiz do repositório
Depois de extrair, a raiz deve conter:

```text
seu-projeto/
├── CLAUDE.md
├── .claude/
├── docs/
├── src/
├── package.json
└── demais arquivos atuais
```

Não substitua arquivos existentes sem comparar o conteúdo.

## 2. Abra o projeto no Obsidian
1. Abra o Obsidian.
2. Escolha **Open folder as vault**.
3. Selecione a pasta raiz do repositório.
4. Confirme a abertura.

O Obsidian criará uma pasta `.obsidian/` com preferências locais.

## 3. Primeira configuração recomendada
Em **Settings → Core plugins**, ative:
- Backlinks;
- Canvas;
- Daily notes;
- Templates;
- Bases, caso disponível na sua versão;
- Properties view;
- File recovery.

Em **Settings → Files and links**:
- New link format: `Shortest path when possible`;
- Use `[[Wikilinks]]`;
- Automatically update internal links: ativado;
- Default location for new notes: `docs/00-Inbox`, após criar essa pasta.

## 4. Templates
Em **Settings → Templates**, configure:
- Template folder location: `docs/08-Templates`.

## 5. Claude Code
Abra o terminal na raiz do projeto e execute:

```powershell
claude
```

Dentro do Claude Code, valide:

```text
/memory
```

O arquivo `CLAUDE.md` deve aparecer entre as memórias carregadas.

## 6. Primeiro comando recomendado ao Claude
Use o prompt em `docs/06-Prompts/01-Auditoria-inicial.md`.

## 7. Git
Antes de qualquer auditoria ou mudança:

```powershell
git status
git add CLAUDE.md .claude docs
git commit -m "docs: add Obsidian project knowledge base"
```

Revise o diff antes do commit.

## 8. Obsidian CLI
Depois de atualizar o Obsidian:
1. Abra **Settings → General**.
2. Ative **Command line interface**.
3. Siga o registro no PATH.
4. Reinicie o terminal.
5. Mantenha o Obsidian aberto e teste:

```powershell
obsidian help
obsidian search query="SaaS"
```
