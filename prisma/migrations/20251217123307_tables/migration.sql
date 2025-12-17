-- CreateTable
CREATE TABLE "cart" (
    "cart_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "cart_pkey" PRIMARY KEY ("cart_id")
);

-- CreateTable
CREATE TABLE "cartitems" (
    "cart_item_id" SERIAL NOT NULL,
    "cart_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "cartitems_pkey" PRIMARY KEY ("cart_item_id")
);

-- CreateTable
CREATE TABLE "category" (
    "category_id" SERIAL NOT NULL,
    "category_name" VARCHAR(100) NOT NULL,

    CONSTRAINT "category_pkey" PRIMARY KEY ("category_id")
);

-- CreateTable
CREATE TABLE "delivery" (
    "delivery_id" SERIAL NOT NULL,
    "delivery_method" VARCHAR(100) NOT NULL,
    "delivery_address" VARCHAR(255) NOT NULL,
    "order_status" VARCHAR(50) NOT NULL,

    CONSTRAINT "delivery_pkey" PRIMARY KEY ("delivery_id")
);

-- CreateTable
CREATE TABLE "orders" (
    "order_id" SERIAL NOT NULL,
    "cart_id" INTEGER NOT NULL,
    "delivery_date" DATE NOT NULL,
    "total_price" DECIMAL(10,2) NOT NULL,
    "order_status" VARCHAR(50) NOT NULL,
    "delivery_id" INTEGER NOT NULL,
    "payment_id" INTEGER NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("order_id")
);

-- CreateTable
CREATE TABLE "payment" (
    "payment_id" SERIAL NOT NULL,
    "transaction_date" TIMESTAMP(6) NOT NULL,
    "payment_method" VARCHAR(100) NOT NULL,
    "payment_status" VARCHAR(50) NOT NULL,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("payment_id")
);

-- CreateTable
CREATE TABLE "product" (
    "product_id" SERIAL NOT NULL,
    "product_name" VARCHAR(255) NOT NULL,
    "info" TEXT NOT NULL,
    "price" DECIMAL(10,2),

    CONSTRAINT "product_pkey" PRIMARY KEY ("product_id")
);

-- CreateTable
CREATE TABLE "productcategoryconnection" (
    "product_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,

    CONSTRAINT "productcategoryconnection_pkey" PRIMARY KEY ("product_id","category_id")
);

-- CreateTable
CREATE TABLE "review" (
    "review_id" SERIAL NOT NULL,
    "review_text" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "date_creation" TIMESTAMP(6) NOT NULL,
    "redaction_time" TIMESTAMP(6) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,

    CONSTRAINT "review_pkey" PRIMARY KEY ("review_id")
);

-- CreateTable
CREATE TABLE "users" (
    "user_id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "surname" VARCHAR(50) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "phone_number" VARCHAR(13),
    "address" VARCHAR(255) NOT NULL,
    "region" VARCHAR(100) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_number_key" ON "users"("phone_number");

-- AddForeignKey
ALTER TABLE "cartitems" ADD CONSTRAINT "cartitems_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "cart"("cart_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cartitems" ADD CONSTRAINT "cartitems_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("product_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "cart"("cart_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "delivery"("delivery_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payment"("payment_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "productcategoryconnection" ADD CONSTRAINT "productcategoryconnection_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category"("category_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "productcategoryconnection" ADD CONSTRAINT "productcategoryconnection_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("product_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "review" ADD CONSTRAINT "review_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("product_id") ON DELETE CASCADE ON UPDATE NO ACTION;
