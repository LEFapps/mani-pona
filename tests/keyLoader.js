import fs from 'fs'
import path from 'path'

import { KeyWrapper } from '../client/shared/crypto'

// load from single json file
/*
const KeyLoader = (file) => {
  const key = JSON.parse(fs.readFileSync(file))
  return KeyWrapper(key)
}
*/

// load from separate public.key and private.key files
// TODO: move to tests
export const KeyLoader = dir => {
  const key = {
    publicKeyArmored: fs.readFileSync(path.join(dir, 'public.key'), {
      encoding: 'utf-8'
    }),
    privateKeyArmored: fs.readFileSync(path.join(dir, 'private.key'), {
      encoding: 'utf-8'
    })
  }
  return KeyWrapper(key)
}
