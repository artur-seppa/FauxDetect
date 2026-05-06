import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'expenses'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('category_exceeds_limit').nullable().after('category_match')
      table.string('category_exceeds_limit_detail', 255).nullable().after('category_exceeds_limit')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('category_exceeds_limit')
      table.dropColumn('category_exceeds_limit_detail')
    })
  }
}
