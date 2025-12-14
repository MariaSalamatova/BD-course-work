# BD-course-work

Інтернет магазин.

Робота з базою данних для створення, відміни та відстеження замовлень.

Саламатова Марія ІМ-41

Мова програмування: JavaScript
Бібліотека: Prisma
Фреймворк тестування:


## Структура
```
BD-course-work/
|
|-docs/
  |-queries.md
  |-schema.md
|
|-prisma/
    |-migrations/
     |-20251212232254_1_tables/
       |-migration.sql
    |-migrations_lock.toml
  |-schema.prisma
|
|
|_src/
  |-app.js
  |-prisma.js
  |-queries.md
  |-server.js
    |-controllers/
      |-cart.controller.js
      |-delivery.controller.js
      |-orders.controller.js
      |-payment.controller.js
    |-routes/
      |-cart.routes.js
      |-delivery.routes.js
      |-orders.routes.js
      |-payment.routes.js
```