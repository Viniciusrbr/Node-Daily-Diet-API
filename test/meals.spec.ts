import { execSync } from 'child_process'
import request from 'supertest'
import { app } from '../src/app'
import { describe, beforeAll, afterAll, beforeEach, it } from 'vitest'

describe('Meals routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  it.only('should be able to create a new meal', async () => {
    const userResponse = await request(app.server)
      .post('/users')
      .send({ name: 'Cebolinha', email: 'Cebolinha@Cebolinha.com' })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', userResponse.get('Set-Cookie') ?? [])
      .send({
        name: 'Almoço',
        description: 'Pizza com coquinha gelada',
        isOnDiet: true,
        date: new Date(),
      })
      .expect(201)
  })
})
