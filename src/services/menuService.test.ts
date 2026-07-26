const assert = require('node:assert/strict');
const { buildMenuCategoryViews, resolveMenuPricesFromDatabase } = require('./menuService');

const categories = [
  {
    id: 'cat-2',
    name: 'Desserts',
    displayOrder: 20,
    items: [
      { id: 'item-2', name: 'Cake', displayOrder: 10, featured: false },
      { id: 'item-3', name: 'Ice Cream', displayOrder: 5, featured: true }
    ]
  },
  {
    id: 'cat-1',
    name: 'Drinks',
    displayOrder: 10,
    items: [
      { id: 'item-1', name: 'Tea', displayOrder: 2, featured: true },
      { id: 'item-4', name: 'Coffee', displayOrder: 1, featured: false }
    ]
  }
];

const view = buildMenuCategoryViews(categories);
assert.equal(view[0].name, 'Bestsellers');
assert.deepEqual(view[0].items.map((item: { id: string }) => item.id), ['item-1', 'item-3']);
assert.deepEqual(view.slice(1).map((category: { name: string }) => category.name), ['Drinks', 'Desserts']);
assert.deepEqual(view[1].items.map((item: { id: string }) => item.id), ['item-4', 'item-1']);

// regression test for duplicate featured items across categories
const duplicateFeaturedCategories = [
  {
    id: 'cat-1',
    name: 'Drinks',
    displayOrder: 10,
    items: [
      { id: 'item-1', name: 'Tea', displayOrder: 2, featured: true },
      { id: 'item-4', name: 'Coffee', displayOrder: 1, featured: false }
    ]
  },
  {
    id: 'cat-2',
    name: 'Desserts',
    displayOrder: 20,
    items: [
      { id: 'item-1', name: 'Tea', displayOrder: 2, featured: true }
    ]
  }
];

const duplicateView = buildMenuCategoryViews(duplicateFeaturedCategories);
assert.deepEqual(duplicateView[0].items.map((item: { id: string }) => item.id), ['item-1']);

const dbPriceResult = resolveMenuPricesFromDatabase({
  branchMenuItemBasePrice: 15,
  sizePrices: [
    { sizeName: 'STANDARD', price: 18 },
    { sizeName: 'LARGE', price: 24 }
  ]
});
assert.equal(dbPriceResult.basePrice, 15);
assert.equal(dbPriceResult.displayPrice, 18);
assert.deepEqual(dbPriceResult.sizePrices.map((size: { name: string; price: number }) => ({ name: size.name, price: size.price })), [
  { name: 'STANDARD', price: 18 },
  { name: 'LARGE', price: 24 }
]);

console.log('menu ordering tests passed');
