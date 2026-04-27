import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import Category from '#models/category'

export default class InitialSeeder extends BaseSeeder {
  async run() {
    await Category.createMany([
      { name: 'Lunch', maxAmount: 80.0, active: true },
      { name: 'Uber', maxAmount: 200.0, active: true },
      { name: 'Hotel', maxAmount: 500.0, active: true },
      { name: 'Office Supplies', maxAmount: 150.0, active: true },
      { name: 'Parking', maxAmount: 50.0, active: true },
    ])

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
