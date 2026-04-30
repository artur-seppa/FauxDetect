import type { HttpContext } from '@adonisjs/core/http'
import Category from '#models/category'
import CategoryKeyword from '#models/category_keyword'
import CategoryPolicy from '#policies/category_policy'
import { storeCategoryValidator, updateCategoryValidator } from '#validators/category_validator'

export default class CategoriesController {
  async index({ response }: HttpContext) {
    const categories = await Category.query().orderBy('name', 'asc').preload('keywords')
    return response.ok(categories)
  }

  async store({ bouncer, request, response }: HttpContext) {
    await bouncer.with(CategoryPolicy).authorize('create')

    const data = await request.validateUsing(storeCategoryValidator)

    const existing = await Category.findBy('name', data.name)
    if (existing) {
      return response.conflict({ message: 'Category name already in use' })
    }

    const category = await Category.create({
      name: data.name,
      maxAmount: data.maxAmount ?? null,
      active: data.active ?? true,
    })

    if (data.keywords?.length) {
      await CategoryKeyword.createMany(
        data.keywords.map((name) => ({ categoryId: category.id, name }))
      )
    }

    await category.load('keywords')

    return response.created(category)
  }

  async update({ bouncer, params, request, response }: HttpContext) {
    await bouncer.with(CategoryPolicy).authorize('update')

    const category = await Category.findOrFail(params.id)
    const data = await request.validateUsing(updateCategoryValidator)

    if (data.name && data.name !== category.name) {
      const existing = await Category.query()
        .where('name', data.name)
        .whereNot('id', category.id)
        .first()

      if (existing) {
        return response.conflict({ message: 'Category name already in use' })
      }
    }

    category.merge({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.maxAmount !== undefined && { maxAmount: data.maxAmount }),
      ...(data.active !== undefined && { active: data.active }),
    })

    await category.save()

    if (data.keywords !== undefined) {
      await CategoryKeyword.query().where('categoryId', category.id).delete()
      if (data.keywords.length) {
        await CategoryKeyword.createMany(
          data.keywords.map((name) => ({ categoryId: category.id, name }))
        )
      }
    }

    await category.load('keywords')

    return response.ok(category)
  }

  async destroy({ bouncer, params, response }: HttpContext) {
    await bouncer.with(CategoryPolicy).authorize('delete')

    const category = await Category.findOrFail(params.id)
    await category.delete()

    return response.ok({ message: 'Category deleted successfully' })
  }
}
