import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'expenses'

  async up() {
    await this.schema.raw(
      `ALTER TABLE ${this.tableName} DROP CONSTRAINT IF EXISTS ${this.tableName}_file_hash_unique`
    )
  }

  async down() {
    // no-op: migration 4 does not create this constraint
  }
}
