import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import Category from '#models/category'
import CategoryKeyword from '#models/category_keyword'

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Lunch: ['restaurant', 'food', 'lunch', 'snack', 'ifood'],
  Uber: ['uber', '99', 'ride', 'transport', 'taxi'],
  Hotel: ['hotel', 'airbnb', 'accommodation', 'inn'],
  'Office Supplies': ['stationery', 'office', 'pen', 'notebook'],
  Parking: ['parking', 'valet', 'garage'],
}

export default class InitialSeeder extends BaseSeeder {
  async run() {
    const categories = await Category.createMany([
      { name: 'Lunch', maxAmount: 80.0, active: true },
      { name: 'Uber', maxAmount: 200.0, active: true },
      { name: 'Hotel', maxAmount: 500.0, active: true },
      { name: 'Office Supplies', maxAmount: 150.0, active: true },
      { name: 'Parking', maxAmount: 50.0, active: true },
    ])

    await CategoryKeyword.createMany(
      categories.flatMap((category) =>
        (CATEGORY_KEYWORDS[category.name] ?? []).map((name) => ({
          categoryId: category.id,
          name,
        }))
      )
    )

    await User.createMany([
      {
        fullName: 'HR Admin',
        email: 'hr@company.com',
        password: 'admin123',
        role: 'hr',
        department: 'human resources',
      },
      {
        fullName: 'John Employee',
        email: 'john@company.com',
        password: 'password123',
        role: 'employee',
        department: 'engineering',
      },
    ])
  }
}
