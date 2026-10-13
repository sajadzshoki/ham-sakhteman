import { readBody } from 'h3'
import { joinByCode } from '../../services/buildings.service'
import { defineApi, requireUser } from '../../utils/api'

export default defineApi(async (event) => joinByCode(requireUser(event), await readBody(event)))
