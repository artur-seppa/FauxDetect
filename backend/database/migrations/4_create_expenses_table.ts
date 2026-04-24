import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'expenses'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // Owner
      table.integer('user_id').notNullable().unsigned().references('id').inTable('users').onDelete('CASCADE')

      // Uploaded file
      table.string('original_filename').notNullable()
      table.string('file_path').notNullable()
      table.string('file_hash').notNullable().unique()

      // Category selected by employee
      table.integer('selected_category_id').unsigned().nullable().references('id').inTable('categories').onDelete('SET NULL')
      table.string('employee_description').nullable()

      // Data extracted by Google Document AI
      table.decimal('extracted_amount', 10, 2).nullable()
      table.date('extracted_date').nullable()
      table.string('extracted_vendor').nullable()
      table.string('extracted_description').nullable()

      // Fraud analysis
      table.jsonb('fraud_signals').nullable()
      table.integer('fraud_score').nullable()
      table.text('fraud_details').nullable()
      table.boolean('category_match').nullable()

      // Workflow
      table.enum('status', ['processing', 'pending', 'approved', 'rejected', 'manual_review']).notNullable().defaultTo('processing')
      table.text('rejection_reason').nullable()
      table.integer('approved_by').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL')
      table.timestamp('approved_at').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
