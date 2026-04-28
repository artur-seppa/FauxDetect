/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const AuthController = () => import('#controllers/auth_controller')
const CategoriesController = () => import('#controllers/categories_controller')
const ExpensesController = () => import('#controllers/expenses_controller')

router.group(() => {
  router.post('/auth/login', [AuthController, 'login'])
  router.post('/auth/register', [AuthController, 'register'])
  router.delete('/auth/logout', [AuthController, 'logout']).use(middleware.auth())
}).prefix('/api/auth')

router.group(() => {
  router.resource('categories', CategoriesController).only(['index', 'store', 'update', 'destroy'])
}).prefix('/api').use(middleware.auth())

router.group(() => {
  router.get('/expenses', [ExpensesController, 'index'])
  router.post('/expenses', [ExpensesController, 'store'])
  router.get('/expenses/:id', [ExpensesController, 'show'])
  router.patch('/expenses/:id/approve', [ExpensesController, 'approve'])
  router.patch('/expenses/:id/reject', [ExpensesController, 'reject'])
}).prefix('/api').use(middleware.auth())
