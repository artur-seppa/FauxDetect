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
  router.post('/login', [AuthController, 'login'])
  router.post('/register', [AuthController, 'register'])
  router.delete('/logout', [AuthController, 'logout']).use(middleware.auth())
}).prefix('/api/auth')

router.group(() => {
  router.resource('categories', CategoriesController).only(['index', 'store', 'update', 'destroy'])
}).prefix('/api').use(middleware.auth())

router.group(() => {
  router.get('/', [ExpensesController, 'index'])
  router.post('/', [ExpensesController, 'store'])
  router.get('/:id', [ExpensesController, 'show'])
  router.patch('/:id/approve', [ExpensesController, 'approve'])
  router.patch('/:id/reject', [ExpensesController, 'reject'])
}).prefix('/api/expenses').use(middleware.auth())
