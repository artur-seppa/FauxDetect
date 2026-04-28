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

router.group(() => {
  router.post('/auth/login', [AuthController, 'login'])
  router.post('/auth/register', [AuthController, 'register'])
  router.delete('/auth/logout', [AuthController, 'logout']).use(middleware.auth())

  router.group(() => {
    router.get('/categories', [CategoriesController, 'index'])
    router.post('/categories', [CategoriesController, 'store'])
    router.patch('/categories/:id', [CategoriesController, 'update'])
    router.delete('/categories/:id', [CategoriesController, 'destroy'])
  }).use(middleware.auth())
}).prefix('/api')
