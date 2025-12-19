# BD-course-work

Інтернет магазин.

Робота з базою данних для створення, відміни та відстеження замовлень.

Саламатова Марія ІМ-41

Мова програмування: JavaScript
Бібліотека: Prisma
Фреймворк тестування: Jest


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
|
|_test/
      |-cart.test.js
      |-deletecanceledorder.test.js
      |-delivery.test.js
      |-getuserorder.test.js
      |-orderstatusupdate.test.js
      |-orderwithitems.test.js
      |-payment.test.js
      |-productsbycategory.test.js
|
|_.env
|
|_package-lock.json
|
|_package.json
|
|_README.md
```
