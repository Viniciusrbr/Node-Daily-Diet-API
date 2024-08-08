import { execSync } from 'child_process'
import request from 'supertest'
import { app } from '../src/app'
import { describe, beforeAll, afterAll, beforeEach, it, expect } from 'vitest'

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

  it('should be able to create a new meal', async () => {
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

  it('should be able to list all meals from a user', async () => {
    const userResponse = await request(app.server)
      .post('/users')
      .send({ name: 'Cebolinha', email: 'cebolinha@cebolinha.com' })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', userResponse.get('Set-Cookie') ?? [])
      .send({
        name: 'Café da manhã',
        description: 'Pão com ovos e bacon',
        isOnDiet: true,
        date: new Date(),
      })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', userResponse.get('Set-Cookie') ?? [])
      .send({
        name: 'Almoço',
        description: 'Feijoada com farofa e couve',
        isOnDiet: true,
        date: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day after
      })
      .expect(201)

    const mealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', userResponse.get('Set-Cookie') ?? [])
      .expect(200)

    expect(mealsResponse.body.meals).toHaveLength(2)

    // This validate if the order is correct
    expect(mealsResponse.body.meals[0].name).toBe('Almoço')
    expect(mealsResponse.body.meals[1].name).toBe('Café da manhã')
  })

  it('should be able to show a single meal', async () => {
    const userResponse = await request(app.server)
      .post('/users')
      .send({ name: 'Pedrinho', email: 'pedrinho@pedrinho.com' })
      .expect(201)

    await request(app.server)
      .post('/meals')
      .set('Cookie', userResponse.get('Set-Cookie') ?? [])
      .send({
        name: 'Lanche',
        description: 'Empada de frango',
        isOnDiet: true,
        date: new Date(),
      })
      .expect(201)

    const mealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', userResponse.get('Set-Cookie') ?? [])
      .expect(200)

    const mealId = mealsResponse.body.meals[0].id

    const mealResponse = await request(app.server)
      .get(`/meals/${mealId}`)
      .set('Cookie', userResponse.get('Set-Cookie') ?? [])
      .expect(200)

    expect(mealResponse.body).toEqual({
      meal: expect.objectContaining({
        name: 'Lanche',
        description: 'Empada de frango',
        is_on_diet: 1,
        date: expect.any(Number),
      }),
    })
  })
})
