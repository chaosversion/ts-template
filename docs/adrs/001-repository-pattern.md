# ADR-001: Repository Pattern

## Status
✅ Aprovado

## Contexto
Necessidade de desacoplar a lógica de acesso a dados dos controllers e serviços

## Decisão
Adotamos o Repository Pattern com as seguintes características:
- Interface única por agregado
- Implementação concreta com Knex
- Injeção de dependência via construtor

## Consequências
✅ Vantagens:
- Testabilidade melhorada
- Troca fácil de implementação
- Código mais organizado

⚠️ Desvantagens:
- Complexidade inicial aumentada
- Boilerplate adicional