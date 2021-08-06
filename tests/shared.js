import { mani, convertMani } from '../client/shared/mani'
import ManiClient from '../client/src/maniClient'
import { KeyGenerator, KeyWrapper } from '../client/shared/crypto'
import * as tools from '../client/shared/tools'
// simply here to make imports of shared code more convenient

const shared = { mani, convertMani, ManiClient, KeyGenerator, KeyWrapper, ...tools }

export default shared
