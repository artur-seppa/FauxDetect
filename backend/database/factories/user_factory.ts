import factory from '@adonisjs/lucid/factories'
import User from '#models/user'

export const UserFactory = factory
  .define(User, ({ faker }) => {
    return {
      fullName: faker.person.fullName(),
      email: faker.internet.email({ provider: 'example.com' }).toLowerCase(),
      password: 'Test@12345',
      role: 'employee' as const,
      department: null,
    }
  })
  .build()
