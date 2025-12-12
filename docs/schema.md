### Таблиця: `users`

Призначення: Зберігає інформацію про облікові записи користувачів

Стовпці:
| Стовпець | Тип | Обмеження | Опис |
|----------|-----|-----------|------|
| user_id | SERIAL | PRIMARY KEY | Ідентифікатор користувача |
| name | VARCHAR(50) | NOT NULL | Ім'я користувача | 
| surname | VARCHAR(50) | NOT NULL | Фамілія користувача |
| user_email | VARCHAR(254) | UNIQUE, NOT NULL | Email користувача |
| phone_number | VARCHAR(13) | UNIQUE, | Телефон користувача |
| address | VARCHAR(255) | NOT NULL | Адреса, яку ввів користувач|
| region | VARCHAR(100) | NOT NULL | Область |

### Таблиця: `cart`

Призначення: Кошик користувача, куди додаються товари.

Стовпці:
| Стовпець | Тип | Обмеження | Опис |
|----------|-----|-----------|------|
| cart_id | SERIAL | NOT NULL | Ідентифікатор кошика |
| user_id | INTEGER | NOT NULL | Ідентифікатор користувача якому він належить |

### Таблиця: `cartitems`

Призначення: Товари що додані в кошик.

Стовпці:
| Стовпець | Тип | Обмеження | Опис |
|----------|-----|-----------|------|
| cart_item_id | SERIAL | NOT NULL | Ідентифікатор товарів в кошику |
| cart_id | INTEGER | NOT NULL | Кошик в якому вони знаходяться |
| product_id | INTEGER | NOT NULL | Ідентифікатор товару |
| quantity | INTEGER | NOT NULL | Кількість товару |

### Таблиця: `category`

Призначення: Категорії товарів що є в магазині.

Стовпці:
| Стовпець | Тип | Обмеження | Опис |
|----------|-----|-----------|------|
| category_id | SERIAL | NOT NULL | Ідентифікатор категорії |
| category_name | VARCHAR(100) | NOT NULL | Назва категорії |

### Таблиця: `delivery`

Призначення: Доставка товарів.

Стовпці:
| Стовпець | Тип | Обмеження | Опис |
|----------|-----|-----------|------|
| delivery_id | SERIAL | NOT NULL | Трек-номер замовлення |
| delivery_method | VARCHAR(100) | NOT NULL | Спосіб доставки |
| delivery_address | VARCHAR(255) | NOT NULL | Адреса доставки |
| order_status | VARCHAR(50) | NOT NULL | Статус замовлення |


### Таблиця: `orders`

Призначення: Замовлення.

Стовпці:
| Стовпець | Тип | Обмеження | Опис |
|----------|-----|-----------|------|
| order_id | SERIAL | NOT NULL | Номер замовлення |
| cart_id | INTEGER | NOT NULL | Ідентифікатор кошику в якому його створено |
| delivery_date | DATE | NOT NULL | Дата доставки |
| total_price | DECIMAL(10,2) | NOT NULL | Сума |
| order_status | VARCHAR(50) | NOT NULL | Статус замовлення |
| delivery_id | INTEGER | NOT NULL | Трек номер замовлення |
| payment_id | INTEGER | NOT NULL | Ідентифікатор оплати яке йому належить |

### Таблиця: `payment`

Призначення: Оплата замовлень.

Стовпці:
| Стовпець | Тип | Обмеження | Опис |
|----------|-----|-----------|------|
| payment_id | SERIAL | NOT NULL | Ідентифікатор оплати |
| transaction_date | TIMESTAMP(6) | NOT NULL | Дата транзакції |
| payment_method | VARCHAR(100) | NOT NULL | Спосіб оплати |
| payment_status | VARCHAR(50) | NOT NULL | Статус оплати |

### Таблиця: `product`

Призначення: Товари що є в магазині.

Стовпці:
| Стовпець | Тип | Обмеження | Опис |
|----------|-----|-----------|------|
| product_id | SERIAL | NOT NULL | Ідентифікатор продукту |
| product_name | VARCHAR(255) | NOT NULL | Назва продукту |
| info | TEXT | NOT NULL | Інформація про товар |
| price | DECIMAL(10,2) | Ціна товару |

### Таблиця: `productcategoryconnection`

Призначення: Зв'язок товарів та їх категорій.

Стовпці:
| Стовпець | Тип | Обмеження | Опис |
|----------|-----|-----------|------|
| product_id | INTEGER | NOT NULL | Ідентифікатор продукту |
| category_id | INTEGER | NOT NULL | Ідентифікатор категорії яка йому належить |

### Таблиця: `review`

Призначення: Відгуки до товарів.

Стовпці:
| Стовпець | Тип | Обмеження | Опис |
|----------|-----|-----------|------|
| review_id | SERIAL | NOT NULL | Ідентифікатор відгуку |
| review_text | TEXT | NOT NULL | Текст відгуку |
| rating | INTEGER | NOT NULL | Рейтинг |
| date_creation | TIMESTAMP(6) | NOT NULL | Дата створення |
| redaction_time | TIMESTAMP(6) | NOT NULL | Зміна відгуку |
| user_id | INTEGER | NOT NULL | Ідентифікатор користувача якому він належить |
| product_id | INTEGER | NOT NULL | Іднтифікатор продукту якому воно належить |


Зв'язки:
- Один-до-багатьох з `orders`