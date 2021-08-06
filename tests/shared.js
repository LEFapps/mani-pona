import { mani, convertMani } from '../client/shared/mani'
import { KeyGenerator, KeyWrapper } from '../client/shared/crypto'
import * as tools from '../client/shared/tools'
// simply here to make imports of shared code more convenient

const shared = { mani, convertMani, KeyGenerator, KeyWrapper, ...tools }

export default shared
