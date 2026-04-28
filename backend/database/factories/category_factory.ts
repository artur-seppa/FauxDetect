import factory from '@adonisjs/lucid/factories'
import Category from '#models/category'

export const CategoryFactory = factory
  .define(Category, ({ faker }) => {
    return {
      name: faker.commerce.department(),
      maxAmount: null,
      active: true,
    }
  })
  .build()
