import { BaseSchema } from '@adonisjs/lucid/schema'

const DEPARTMENTS = ['engineering', 'human resources', 'finance', 'marketing', 'operations', 'sales']

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.raw(
      `ALTER TABLE ${this.tableName} ADD CONSTRAINT ${this.tableName}_department_check
       CHECK (department IN (${DEPARTMENTS.map((d) => `'${d}'`).join(', ')}))`
    )
  }

  async down() {
    this.schema.raw(
      `ALTER TABLE ${this.tableName} DROP CONSTRAINT ${this.tableName}_department_check`
    )
  }
}
