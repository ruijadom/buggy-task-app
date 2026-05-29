# Buggy Task App

React + TypeScript + Tailwind task board com **6 bugs intencionais** para testar o pipeline Sandcastle.

## Setup

```bash
npm install
npm run dev
```

## Os 6 Bugs

| # | Ficheiro | Bug | Comportamento visível |
|---|---|---|---|
| 1 | `src/utils/index.ts` | `sortTasksByPriority` **muta o array original** em vez de ordenar uma cópia | A ordem das tasks muda de forma imprevisível ao aplicar filtros |
| 2 | `src/utils/index.ts` | `formatDueDate` não tem guard para `undefined` | Cards sem due date mostram "Invalid Date" |
| 3 | `src/hooks/useTasks.ts` | `useEffect` de persistência tem **dependency array vazio** `[]` | Alterações às tasks (adicionar, apagar) perdem-se ao recarregar a página |
| 4 | `src/hooks/useTasks.ts` | Filtro de pesquisa **não faz lowercase** | Pesquisar "fix" não encontra "Fix WebRTC audio dropout" |
| 5 | `src/components/TaskCard.tsx` | `STATUS_CYCLE` salta "in-progress" — `'todo'` mapeia para `'done'` | Clicar no badge de status vai directo de To Do para Done |
| 6 | `src/components/AddTaskModal.tsx` | `resetForm()` nunca é chamado após submit | Ao reabrir o modal, os campos do formulário anterior continuam preenchidos |

## Criar Issues no Jira

Para cada bug, cria um ticket com:
- **Type:** Bug
- **Priority:** (ver tabela em baixo)
- **Labels:** `sandcastle-agent`

| Ticket | Título sugerido | Priority |
|---|---|---|
| BUG-1 | `sortTasksByPriority` mutates original array causing unpredictable render order | Medium |
| BUG-2 | `formatDueDate` shows "Invalid Date" for tasks without due date | Low |
| BUG-3 | Task changes lost on page reload — useEffect missing dependency | High |
| BUG-4 | Search filter is case-sensitive — lowercase query misses results | Medium |
| BUG-5 | Status cycle skips "In Progress" — goes directly from To Do to Done | High |
| BUG-6 | Add task modal retains previous form values after submit | Low |
