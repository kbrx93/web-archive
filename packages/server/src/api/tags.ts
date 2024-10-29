import { isNil, isNumberString } from '@web-archive/shared/utils'
import { Hono } from 'hono'
import { validator } from 'hono/validator'
import type { HonoTypeUserInformation } from '~/constants/binding'
import { insertTag, selectAllTags, updateTag } from '~/model/tag'
import result from '~/utils/result'

const app = new Hono<HonoTypeUserInformation>()

app.get('/all', async (c) => {
  const tags = await selectAllTags(c.env.DB)

  return c.json(result.success(tags))
})

app.post(
  '/create',
  validator('json', (value, c) => {
    if (isNil(value.name) || typeof value.name !== 'string') {
      return c.json(result.error(400, 'Name is required'))
    }
    // todo check color type?
    return {
      name: value.name as string,
      color: value.color,
    }
  }),
  async (c) => {
    const { name, color = '#ffffff' } = c.req.valid('json')

    if (await insertTag(c.env.DB, { name, color })) {
      return c.json(result.success(true))
    }

    return c.json(result.error(500, 'Failed to create tag'))
  },
)

app.post(
  '/update',
  validator('json', (value, c) => {
    if (isNil(value.id) || !isNumberString(value.id)) {
      return c.json(result.error(400, 'ID is required'))
    }
    if (isNil(value.name) && isNil(value.color) && isNil(value.pageIds)) {
      return c.json(result.error(400, 'Name, color, or pageIds is required'))
    }

    return {
      id: Number(value.id),
      name: value.name,
      color: value.color,
      pageIds: value.pageIds as Array<number> | undefined,
    }
  }),
  async (c) => {
    const { id, name, color, pageIds } = c.req.valid('json')

    if (await updateTag(c.env.DB, { id, name, color, pageIds })) {
      return c.json(result.success(true))
    }

    return c.json(result.error(500, 'Failed to update tag'))
  },
)

export default app