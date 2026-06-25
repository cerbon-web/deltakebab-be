import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', table => {
    table.increments('id').primary();
    table.string('name', 150).notNullable();
    table.string('email', 255).unique();
    table.string('phone', 50).unique().notNullable();
    table.string('password_hash', 255).notNullable();
    table.enu('role', ['CUSTOMER', 'STAFF', 'DRIVER', 'ADMIN']).notNullable().defaultTo('CUSTOMER');
    table.enu('provider', ['LOCAL', 'GOOGLE', 'APPLE']).notNullable().defaultTo('LOCAL');
    table.string('provider_id', 255);
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('customers', table => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
    table.string('name', 150).notNullable();
    table.string('phone', 50).notNullable();
    table.string('email', 255);
    table.string('guest_token', 255);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('restaurant_staff', table => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('restaurant_id').unsigned().notNullable().references('id').inTable('restaurant_info').onDelete('CASCADE');
    table.enu('role', ['KITCHEN', 'FRONT_DESK', 'MANAGER']).notNullable().defaultTo('KITCHEN');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('drivers', table => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.enu('status', ['ACTIVE', 'INACTIVE', 'ON_SHIFT']).notNullable().defaultTo('ACTIVE');
    table.string('vehicle_details', 255);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('restaurant_hours', table => {
    table.increments('id').primary();
    table.integer('restaurant_id').unsigned().notNullable().references('id').inTable('restaurant_info').onDelete('CASCADE');
    table.string('day_range', 50).notNullable();
    table.string('open_time', 20).notNullable();
    table.boolean('is_active').notNullable().defaultTo(true);
  });

  await knex.schema.createTable('restaurant_delivery_rules', table => {
    table.increments('id').primary();
    table.integer('restaurant_id').unsigned().notNullable().references('id').inTable('restaurant_info').onDelete('CASCADE');
    table.decimal('min_order_value', 10, 2);
    table.integer('base_distance_km');
    table.decimal('base_cost', 10, 2);
    table.decimal('extra_km_cost', 10, 2);
    table.decimal('free_delivery_threshold', 10, 2);
  });

  await knex.schema.createTable('restaurant_item_overrides', table => {
    table.increments('id').primary();
    table.integer('restaurant_id').unsigned().notNullable().references('id').inTable('restaurant_info').onDelete('CASCADE');
    table.integer('item_id').unsigned().notNullable().references('id').inTable('items').onDelete('CASCADE');
    table.boolean('is_available').notNullable().defaultTo(true);
    table.decimal('price', 10, 2);
    table.integer('size_id').unsigned().references('id').inTable('sizes').onDelete('SET NULL');
    table.unique(['restaurant_id', 'item_id', 'size_id']);
  });

  await knex.schema.createTable('orders', table => {
    table.increments('id').primary();
    table.integer('restaurant_id').unsigned().notNullable().references('id').inTable('restaurant_info').onDelete('CASCADE');
    table.integer('customer_id').unsigned().references('id').inTable('customers').onDelete('SET NULL');
    table.string('guest_name', 150);
    table.string('guest_phone', 50);
    table.enu('order_type', ['DELIVERY', 'SELF_PICKUP']).notNullable().defaultTo('DELIVERY');
    table.enu('payment_method', ['CASH', 'CARD']).notNullable().defaultTo('CASH');
    table.enu('payment_status', ['PENDING', 'CONFIRMED', 'FAILED']).notNullable().defaultTo('PENDING');
    table.enu('status', ['NEW', 'RECEIVED', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'ON_THE_WAY', 'DELIVERED', 'FINISHED', 'CANCELLED']).notNullable().defaultTo('NEW');
    table.string('delivery_address', 255);
    table.decimal('delivery_lat', 10, 7);
    table.decimal('delivery_lng', 10, 7);
    table.decimal('delivery_fee', 10, 2).defaultTo(0);
    table.decimal('subtotal', 10, 2).notNullable().defaultTo(0);
    table.decimal('total', 10, 2).notNullable().defaultTo(0);
    table.text('notes');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('order_items', table => {
    table.increments('id').primary();
    table.integer('order_id').unsigned().notNullable().references('id').inTable('orders').onDelete('CASCADE');
    table.integer('item_id').unsigned().notNullable().references('id').inTable('items').onDelete('RESTRICT');
    table.integer('size_id').unsigned().references('id').inTable('sizes').onDelete('SET NULL');
    table.integer('quantity').unsigned().notNullable().defaultTo(1);
    table.decimal('unit_price', 10, 2).notNullable();
    table.decimal('line_total', 10, 2).notNullable();
    table.text('notes');
  });

  await knex.schema.createTable('order_status_history', table => {
    table.increments('id').primary();
    table.integer('order_id').unsigned().notNullable().references('id').inTable('orders').onDelete('CASCADE');
    table.enu('status', ['NEW', 'RECEIVED', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'ON_THE_WAY', 'DELIVERED', 'FINISHED', 'CANCELLED']).notNullable();
    table.enu('actor_type', ['CUSTOMER', 'STAFF', 'DRIVER', 'SYSTEM']).notNullable();
    table.integer('actor_id').unsigned();
    table.text('comment');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('driver_assignments', table => {
    table.increments('id').primary();
    table.integer('order_id').unsigned().notNullable().references('id').inTable('orders').onDelete('CASCADE');
    table.integer('driver_id').unsigned().notNullable().references('id').inTable('drivers').onDelete('CASCADE');
    table.timestamp('assigned_at').defaultTo(knex.fn.now());
    table.timestamp('accepted_at');
    table.timestamp('picked_up_at');
    table.timestamp('delivered_at');
  });

  await knex.schema.createTable('chat_rooms', table => {
    table.increments('id').primary();
    table.integer('order_id').unsigned().notNullable().references('id').inTable('orders').onDelete('CASCADE');
    table.enu('type', ['CUSTOMER_RESTAURANT', 'CUSTOMER_DRIVER']).notNullable();
    table.boolean('is_archived').notNullable().defaultTo(false);
    table.timestamp('expires_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('chat_messages', table => {
    table.increments('id').primary();
    table.integer('room_id').unsigned().notNullable().references('id').inTable('chat_rooms').onDelete('CASCADE');
    table.integer('sender_user_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
    table.enu('sender_role', ['CUSTOMER', 'STAFF', 'DRIVER', 'SYSTEM']).notNullable();
    table.text('message').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('notifications', table => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('order_id').unsigned().references('id').inTable('orders').onDelete('SET NULL');
    table.string('type', 100).notNullable();
    table.string('title', 255).notNullable();
    table.text('body').notNullable();
    table.json('payload');
    table.boolean('is_read').notNullable().defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('notifications');
  await knex.schema.dropTableIfExists('chat_messages');
  await knex.schema.dropTableIfExists('chat_rooms');
  await knex.schema.dropTableIfExists('driver_assignments');
  await knex.schema.dropTableIfExists('order_status_history');
  await knex.schema.dropTableIfExists('order_items');
  await knex.schema.dropTableIfExists('orders');
  await knex.schema.dropTableIfExists('restaurant_item_overrides');
  await knex.schema.dropTableIfExists('restaurant_delivery_rules');
  await knex.schema.dropTableIfExists('restaurant_hours');
  await knex.schema.dropTableIfExists('drivers');
  await knex.schema.dropTableIfExists('restaurant_staff');
  await knex.schema.dropTableIfExists('customers');
  await knex.schema.dropTableIfExists('users');
}
