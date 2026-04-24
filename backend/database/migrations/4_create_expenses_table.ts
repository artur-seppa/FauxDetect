import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'expenses'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id', 26).primary()

      // Owner
      table.string('user_id', 26).notNullable().references('id').inTable('users').onDelete('CASCADE')

      // Uploaded file
      table.string('original_filename').notNullable()
      table.string('file_path').notNullable()
      table.string('file_hash').notNullable().unique()

      // Category selected by employee
      table.string('selected_category_id', 26).nullable().references('id').inTable('categories').onDelete('SET NULL')
      table.string('employee_description').nullable()

      // Data extracted by Google Document AI
      table.decimal('extracted_amount', 10, 2).nullable()
      table.date('extracted_date').nullable()
      table.string('extracted_vendor').nullable()
      table.string('extracted_description').nullable()

      // Fraud analysis — fraud_score stored alongside fraud_signals for
      // performance and audit trail (immutable result from processing time)
      table.jsonb('fraud_signals').nullable()
      table.integer('fraud_score').nullable()
      table.text('fraud_details').nullable()
      table.boolean('category_match').nullable()

      // Workflow
      table.enum('status', ['processing', 'pending', 'approved', 'rejected', 'manual_review']).notNullable().defaultTo('processing')
      table.text('rejection_reason').nullable()
      table.string('approved_by', 26).nullable().references('id').inTable('users').onDelete('SET NULL')
      table.timestamp('approved_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
