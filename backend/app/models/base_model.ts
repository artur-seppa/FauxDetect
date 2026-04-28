import { BaseModel, beforeCreate } from '@adonisjs/lucid/orm'
import { ulid } from 'ulidx'

export default class AppBaseModel extends BaseModel {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUlid(model: AppBaseModel) {
    if (!(model as any).id) {
      ;(model as any).id = ulid()
    }
  }
}
