import { DateTime } from 'luxon'
import { column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import type { CherryPick } from '@adonisjs/lucid/types/model'
import AppBaseModel from '#models/base_model'
import Expense from '#models/expense'
import CategoryKeyword from '#models/category_keyword'

export default class Category extends AppBaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column()
  declare maxAmount: number | null

  @column()
  declare active: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasMany(() => Expense, { foreignKey: 'selectedCategoryId' })
  declare expenses: HasMany<typeof Expense>

  @hasMany(() => CategoryKeyword, { serializeAs: null })
  declare keywords: HasMany<typeof CategoryKeyword>

  serialize(cherryPick?: CherryPick) {
    return {
      ...super.serialize(cherryPick),
      keywords: this.$preloaded.keywords
        ? (this.keywords as CategoryKeyword[]).map((kw) => kw.name)
        : [],
    }
  }
}
